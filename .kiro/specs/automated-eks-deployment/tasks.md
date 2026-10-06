# Implementation Plan: Automated EKS Deployment

## Overview

This plan implements the design in `design.md`: it extends the existing
`.github/workflows/build-and-push.yml` with a self-hosted `deploy` job and adds a
Terraform-managed EKS access entry to the `cicd` module that maps the existing
GitHub Actions role to a derived Kubernetes group, so the role can deploy the
exact Git-SHA image into the `erudition` namespace and verify the rollout. The
namespace-scoped Kubernetes *authorization* is granted by a custom RBAC
`Role`/`RoleBinding` (`k8s/rbac-deployer.yaml`) applied once by the operator via
`scripts/bootstrap-rbac.sh` — deliberately NOT an `AmazonEKSEditPolicy`
association.

The implementation layers are:

1. `cicd` Terraform module — new variables, `access-entries.tf` (access entry
   mapping the role to the derived deployer group, no policy association),
   derived `eks_deployer_group` local, outputs, README, and root wiring
   (R1, R4, R5).
2. Kubernetes RBAC authorization — committed `k8s/rbac-deployer.yaml`
   (Role + RoleBinding, placeholder group subject) and the operator-only
   `scripts/bootstrap-rbac.sh` that renders and applies it (R5).
3. Workflow — split into `build-test-push` (preserved) + `deploy` (new), with
   triggers, permissions, concurrency, guards, and deploy steps (R2, R3, R6, R7,
   R8, R9).
4. Root README — automated flow, first-run sequence, runner setup, rollback
   (R10).
5. Non-live validation — `terraform fmt`/`validate`, workflow/YAML sanity,
   `kubectl --dry-run=client`, placeholder substitution check (R11).

---

## SCOPE CONSTRAINT — READ BEFORE EXECUTING ANY TASK

**This phase PREPARES AND VALIDATES CODE CHANGES ONLY.**

Tasks 1–11 are the executable code / documentation / non-live-validation tasks.
The agent MUST implement only the Terraform edits, the Kubernetes RBAC manifest
and bootstrap script (code preparation), the workflow edits, README/docs, and
the **non-live** validation tasks (Tasks 1–11 below). The agent MUST NOT:

- run `terraform apply` or provision any AWS resource,
- create the `erudition` namespace or any Kubernetes object on a live cluster,
- run `scripts/bootstrap-rbac.sh` against a live cluster,
- provision or register a self-hosted runner,
- configure GitHub repository secrets/variables,
- run the workflow, deploy to EKS, or verify a live rollout,
- `git commit` or `git push` any change.

Those live actions are **operator bootstrap / runbook** steps. They are listed
in the separate, documentation-only **"Operator Bootstrap Prerequisites"**
section below as a clearly-labeled, non-executable checklist. That section is
NOT a numbered task (in particular it is NOT "task 8" — task 8 is the real
executable "Document the automated deployment flow in the root README" task).
Its items have no checkboxes the agent should tick and MUST NOT be auto-run.

Non-live validation (`terraform fmt`/`validate -backend=false`, `actionlint`,
`kubectl --dry-run=client` / offline YAML checks) IS in scope and runnable now,
with the caveat that `terraform validate` may require provider plugin download
via `terraform init -backend=false` and no live AWS credentials; if it cannot
run without credentials, fall back to `terraform fmt` + manual review and note
it.

---

## Tasks

- [x] 1. Add new input variables to the `cicd` module
  - Edit `eks-terraform/modules/cicd/variables.tf` to add three variables exactly
    as specified in design §"Components and Interfaces §2":
    - `eks_cluster_name` (`string`, required) with validation
      `length(trimspace(var.eks_cluster_name)) > 0` and a clear error message
      (R5.7).
    - `create_eks_access` (`bool`, default `true`) toggling creation of the EKS
      **access entry** (the namespace RBAC Role/RoleBinding that authorizes the
      role is a separate operator bootstrap step, not created by this toggle).
    - `eks_application_namespace` (`string`, default `"erudition"`) with
      DNS-label validation `can(regex("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$", ...))`
      and a clear error message.
  - Each variable MUST include an explicit `type` and `description`.
  - Do not modify or remove the existing `eks_cluster_arn`, `ecr_repository_arn`,
    `github_*`, or `tags` variables.
  - _Requirements: R4.4, R5.1, R5.4, R5.7_

- [x] 2. Add the EKS access entry (role → group) and operator RBAC authorization
  - [x] 2.1 Create `eks-terraform/modules/cicd/access-entries.tf` and the derived group local
    - Add the derived local `eks_deployer_group =
      "${local.name_prefix}-${var.eks_application_namespace}-deployers"` in
      `eks-terraform/modules/cicd/locals.tf` (not an account-specific identifier;
      it is the contract the operator's RoleBinding references).
    - Add `aws_eks_access_entry.github_actions` with
      `count = var.create_eks_access ? 1 : 0`, `cluster_name =
      var.eks_cluster_name`, `principal_arn = aws_iam_role.github_actions.arn`,
      `type = "STANDARD"`, `kubernetes_groups = [local.eks_deployer_group]`, and
      `tags = merge(var.tags, { Name = "${local.role_name}-access" })` (confirm
      the existing `local.role_name`; adjust if the module uses a different
      local).
    - Add a comment noting an access entry alone grants no Kubernetes
      permissions; here it maps the IAM role to the Kubernetes group
      `local.eks_deployer_group`, which the operator's namespace-scoped RBAC
      RoleBinding binds (least privilege).
    - Do NOT create an `aws_eks_access_policy_association` and do NOT attach
      `AmazonEKSEditPolicy` (or any AWS-managed access policy): authorization is
      a custom RBAC Role/RoleBinding applied by the operator, not an AWS-managed
      policy.
    - Do NOT create, modify, or reference the `erudition` namespace itself
      (operator-created) and do NOT add any ClusterRole/ClusterRoleBinding or
      cluster-scoped association (R5.3, R5.5).
    - _Requirements: R5.1, R5.2, R5.3, R5.5_
  - [x] 2.2 Verify the role's existing IAM permissions are untouched
    - Inspect `eks-terraform/modules/cicd/main.tf` (and any IAM policy files) and
      confirm the ECR authorization-token, repository-ARN-scoped ECR push/pull,
      and cluster-ARN-scoped `eks:DescribeCluster` statements remain exactly as
      they were (no removal, no broadening). Make no changes if already correct.
    - _Requirements: R4.1, R5.6_
  - [x] 2.3 Create the namespace-scoped RBAC manifest and operator bootstrap script
    - This is CODE PREPARATION — writing the committed manifest and script. It is
      distinct from the operator RUNNING the script against a live cluster (that
      run is in the documentation-only "Operator Bootstrap Prerequisites"
      section and is NOT executed in this phase).
    - Create `k8s/rbac-deployer.yaml` with a `Role` + `RoleBinding` in the
      `erudition` namespace:
      - Role rules grant ONLY `get/list/watch/create/update/patch` on
        `deployments`/`replicasets` (`apps`) and `pods`/`services` (core). No
        `secrets`, no `serviceaccounts`, no other resources — deliberately
        narrower than `AmazonEKSEditPolicy`.
      - RoleBinding subject is a `kind: Group` whose `name` is the
        `__EKS_DEPLOYER_GROUP__` placeholder (do NOT hardcode the group name);
        `roleRef` points at the Role above.
    - Create `scripts/bootstrap-rbac.sh` (operator-only, executable; NOT run by
      CI, NOT managed by Terraform):
      - reads the `eks_deployer_group` Terraform output from
        `eks-terraform/envs/dev` (`terraform -chdir=... output -raw
        eks_deployer_group`),
      - FAILS if that output is empty/unavailable, or if the
        `__EKS_DEPLOYER_GROUP__` placeholder still remains after substitution,
      - substitutes the group into a TEMPORARY copy of
        `k8s/rbac-deployer.yaml` (never mutating the committed file),
      - verifies the `erudition` namespace exists but does NOT create it,
      - applies ONLY the Role + RoleBinding and grants nothing beyond the
        manifest.
    - _Requirements: R5.2, R5.3, R5.4_

- [x] 3. Add the `cicd` module outputs and re-export them from the dev root
  - Edit `eks-terraform/modules/cicd/outputs.tf` to add:
    - `eks_access_entry_principal_arn` with value
      `var.create_eks_access ? aws_eks_access_entry.github_actions[0].principal_arn
      : null` and a description noting it is `null` when access is disabled.
    - `eks_deployer_group` with value `local.eks_deployer_group` and a
      description noting the operator's RBAC RoleBinding must bind this group.
  - Edit `eks-terraform/envs/dev/outputs.tf` to re-export both:
    - `eks_deployer_group` = `module.cicd.eks_deployer_group` (operators need it
      to render `k8s/rbac-deployer.yaml`),
    - `github_actions_eks_access_entry_principal_arn` =
      `module.cicd.eks_access_entry_principal_arn`.
  - Do not remove or alter existing outputs (e.g. `github_actions_role_arn`).
  - _Requirements: R5.1, R5.4_

- [x] 4. Wire the new inputs in the dev root module
  - Edit `eks-terraform/envs/dev/main.tf` in the `module "cicd"` block to pass
    `eks_cluster_name = module.eks.eks_cluster_name`.
  - Leave `eks_application_namespace` and `create_eks_access` on their defaults
    (`"erudition"` / `true`); do not add them explicitly unless needed.
  - Preserve all existing `cicd` inputs (`ecr_repository_arn`,
    `eks_cluster_arn`, `github_*`, `tags`, etc.) unchanged.
  - Confirm `module.eks` exposes `eks_cluster_name`; if the output name differs,
    use the actual EKS module output rather than hardcoding the cluster name
    (R4.4, R5.4).
  - _Requirements: R1.1, R4.4, R5.1, R5.4_

- [x] 5. Document the implemented `cicd` access mechanism and the rejected alternative
  - Update `eks-terraform/modules/cicd/README.md` to document the IMPLEMENTED
    mechanism:
    - the new inputs (`eks_cluster_name`, `create_eks_access`,
      `eks_application_namespace`) and the new outputs
      (`eks_access_entry_principal_arn`, `eks_deployer_group`),
    - that the EKS **access entry** only maps the GitHub Actions IAM role to the
      derived Kubernetes group `eks_deployer_group` (authentication); an access
      entry alone grants NO Kubernetes permissions,
    - that **authorization** is granted by the custom namespace-scoped RBAC
      `Role`/`RoleBinding` in `k8s/rbac-deployer.yaml`, applied once by the
      operator via `scripts/bootstrap-rbac.sh` (which substitutes
      `eks_deployer_group` into the RoleBinding subject), granting only
      `get/list/watch/create/update/patch` on
      `deployments`/`replicasets`/`pods`/`services` in the `erudition` namespace,
    - that `AmazonEKSEditPolicy` was deliberately **REJECTED** because it
      over-grants within the namespace (notably read/write on `secrets`, plus
      daemonsets/statefulsets/jobs/cronjobs/ingresses/serviceaccounts), so the
      custom RBAC path is the least-privilege choice (per design §Directive 6).
  - Do NOT describe `AmazonEKSEditPolicy` as the mechanism in use.
  - _Requirements: R5.2, R5.3, R10 (module-level documentation)_

- [x] 6. Rework the workflow into build + deploy jobs
  - [x] 6.1 Update workflow triggers, permissions, and concurrency
    - Edit `.github/workflows/build-and-push.yml` top-level config to match
      design §"Components and Interfaces §1":
      - keep `on.push.branches: [main]`; add `k8s/**` to `on.push.paths`
        (alongside existing `eks-application/**` and the workflow file).
      - add `on.workflow_dispatch.inputs.deploy_sha` (string, default `""`) and
        `on.workflow_dispatch.inputs.rollback` (boolean, default `false`).
      - set workflow-level `permissions: { contents: read }` only.
      - add `concurrency: { group: deploy-erudition-eks-dev, cancel-in-progress:
        false }`.
      - keep `env.AWS_REGION`/`env.ECR_REPOSITORY_URL` sourced from
        `vars`/`secrets` (no hardcoded values).
    - Do NOT add a `pull_request` trigger (R6.4, R6.5).
    - _Requirements: R6.5, R7.1, R7.3, R7.4_
  - [x] 6.2 Preserve the `build-test-push` job unchanged
    - Keep `build-test-push` on `runs-on: ubuntu-latest` with per-job
      `permissions: { id-token: write, contents: read }` and ALL existing steps
      exactly as today (checkout, node, `npm ci`, lint, `next build`, docker
      build, smoke test `curl -f http://localhost:3000/`, OIDC
      `configure-aws-credentials`, ECR login, push `:github.sha` with the
      reuse-if-exists behavior).
    - Make no behavioral change to this job beyond adding the explicit per-job
      `permissions` block if it is not already present.
    - _Requirements: R2.1, R2.2, R2.3_
  - [x] 6.3 Add the `deploy` job skeleton gated on the build job
    - Add a `deploy` job with `needs: build-test-push`, `runs-on: [self-hosted,
      linux, erudition-eks-dev]`, per-job `permissions: { id-token: write,
      contents: read }`, and the job-level guard
      `if: github.ref == 'refs/heads/main' && (github.event_name == 'push' ||
      github.event_name == 'workflow_dispatch')`.
    - First steps: `actions/checkout@v4` of the CURRENT ref only (no old-ref
      checkout), then `aws-actions/configure-aws-credentials@v4` with
      `role-to-assume: ${{ secrets.AWS_ROLE_ARN }}` and `aws-region: ${{
      env.AWS_REGION }}`.
    - _Requirements: R2.4, R4.1, R4.2, R6.1, R6.2, R6.3, R6.4_
  - [x] 6.4 Implement target-SHA resolution and the HEAD-match guard
    - In the `deploy` job, add the shell logic from design §"Deploy job step
      detail" steps 1–2: resolve `TARGET_SHA` from `deploy_sha` when
      `rollback == true` and `deploy_sha` is non-empty, else `github.sha`;
      build `IMAGE_URI="${ECR_REPOSITORY_URL}:${TARGET_SHA}"`.
    - For NORMAL deploys (`rollback != true`) compare `TARGET_SHA` against
      `git ls-remote origin refs/heads/main` and `exit 1` if they differ; skip
      this guard entirely on rollback.
    - _Requirements: R3.1, R7.1, R7.2_
  - [x] 6.5 Implement kubeconfig, ECR existence check, apply/set-image, and rollout
    - Add the remaining deploy steps per design §"Deploy job step detail"
      steps 3–7:
      - `aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"`,
        failing the job before any apply if it errors (R8.1, R8.2).
      - verify the image exists: `aws ecr describe-images --image-ids
        imageTag="$TARGET_SHA" ...` and `exit 1` with a clear message if missing.
      - normal path: `sed` substitute `IMAGE_PLACEHOLDER` -> `IMAGE_URI` in
        `k8s/deployment.yaml`, `grep -q IMAGE_PLACEHOLDER && exit 1` guard, then
        `kubectl -n erudition apply -f` the substituted deployment AND
        `kubectl -n erudition apply -f k8s/service.yaml` (R3.2, R8.3, R8.4, R8.8).
      - rollback path: change only the image reference with `kubectl -n erudition
        set image deploy/erudition-landing app="$IMAGE_URI"` (no old-code
        checkout, no manifest from old commit).
      - `kubectl -n erudition annotate --overwrite deploy/erudition-landing
        app.kubernetes.io/version="$TARGET_SHA"` (provenance only).
      - `kubectl -n erudition rollout status deploy/erudition-landing
        --timeout=300s`; on failure run a diagnostic `kubectl -n erudition get
        pods` + `describe` and fail the job (R8.5, R8.6, R8.7).
    - Read `CLUSTER_NAME`/`ECR_REPOSITORY_NAME`/region from `secrets`/`vars`/
      lookup — no hardcoded account IDs, ARNs, ECR URLs, or cluster
      endpoint/CA/OIDC values (R3.4, R4.3).
    - Do NOT create the `erudition` namespace; do NOT apply `k8s/namespace.yaml`
      from the deploy job (R5.5, R5.8).
    - _Requirements: R3.1, R3.2, R3.3, R3.4, R4.3, R8.1, R8.2, R8.3, R8.4, R8.5, R8.6, R8.7, R8.8_

- [x] 7. Preserve Kubernetes manifest security and shape (no weakening)
  - Review `k8s/deployment.yaml` and `k8s/service.yaml` and confirm the deploy
    job's `apply`/`set image` path does NOT alter: the security context
    (non-root uid/gid 1001, `readOnlyRootFilesystem`, dropped capabilities,
    `allowPrivilegeEscalation: false`, `seccompProfile` RuntimeDefault), the
    startup/readiness/liveness probes on `/` port 3000, resource requests
    (cpu 100m / mem 128Mi) and limits (cpu 500m / mem 256Mi), replica count 2,
    and the `ClusterIP` Service `erudition-landing`.
  - Do NOT edit `k8s/` to weaken any of these; do NOT add an Ingress or load
    balancer. Only confirm the manifests already satisfy R9 and that CI touches
    the image reference, not the shape.
  - _Requirements: R9.1, R9.2, R9.3, R9.4, R9.5, R9.6_

- [x] 8. Document the automated deployment flow in the root README
  - Update the root `README.md` to document, per design §Directive 8 and
    §Security/Cost Considerations:
    - the automated flow from commit to verified rollout (R10.1),
    - the required first-run sequence: (1) provision infra, (2) create the
      `erudition` namespace with operator access, (3) run
      `scripts/bootstrap-rbac.sh` to bind the deployer group to the
      namespace-scoped RBAC Role/RoleBinding, (4) configure GitHub
      secrets/variables and the self-hosted runner, (5) run the workflow,
      (6) verify the rollout (R10.2),
    - the self-hosted runner setup as the operator step for reaching the EKS
      private endpoint (private subnet, labels `self-hosted,linux,
      erudition-eks-dev`, repository-level registration, no runner groups on a
      personal account) (R10.3),
    - the rollback runbook: `workflow_dispatch` with `deploy_sha=<old-sha>` and
      `rollback=true`, image must already exist in ECR, no old code executed
      (R10.4),
    - the teardown note (deregister runner, terminate instance + delete EBS,
      remember NAT/EKS control-plane bill until `terraform destroy`).
  - Write documentation only; do NOT execute any provisioning or workflow step
    while writing it.
  - _Requirements: R10.1, R10.2, R10.3, R10.4_

- [x] 9. Checkpoint — code edits complete
  - Ensure all Terraform, RBAC manifest/script, workflow, manifest-review, and
    README edits above are complete and internally consistent. Ask the user if
    questions arise. Do not run any live/apply/deploy step.

- [x] 10. Non-live validation of the changes (runnable now)
  - [x] 10.1 Terraform formatting
    - Run `terraform fmt -recursive` under `eks-terraform/` to format, then
      `terraform fmt -check -recursive` to confirm clean formatting; fix any
      reported file.
    - _Requirements: R11.1, R11.4_
  - [x]* 10.2 Terraform validation (no live AWS)
    - Run `terraform init -backend=false` then `terraform validate` for the
      `cicd` module and/or `eks-terraform/envs/dev`, WITHOUT configuring the real
      S3 backend and WITHOUT live AWS credentials. Confirm the new access-entry
      resource, derived `eks_deployer_group` local, variables, outputs, and
      validations parse and type-check.
    - If `validate` cannot run without credentials or provider init, note that
      and fall back to `terraform fmt` + manual review.
    - _Requirements: R5.7, R11.2, R11.4_
  - [x]* 10.3 Workflow / YAML sanity
    - Run `actionlint` on `.github/workflows/build-and-push.yml` (and a YAML lint
      of the workflow and `k8s/*.yaml`); confirm the two-job structure, `needs:`,
      the `if:` guard, per-job `permissions`, `concurrency`, and
      `workflow_dispatch` inputs parse correctly. Fix any reported issue.
    - _Requirements: R6.5, R7.1, R11.3, R11.4_
  - [x]* 10.4 Manifest dry-run and placeholder substitution check
    - For `k8s/deployment.yaml`: substitute a sample SHA, run `kubectl apply
      --dry-run=client -f` on the substituted deployment and on
      `k8s/service.yaml`, and verify the `sed` substitution leaves no residual
      `IMAGE_PLACEHOLDER` token (mirrors the R8.3 guard).
    - For `k8s/rbac-deployer.yaml`: it holds the `__EKS_DEPLOYER_GROUP__`
      placeholder, so a client dry-run must use a substituted temporary copy
      (e.g. a sample group) rather than the committed file. Note that
      `kubectl --dry-run=client` needs cluster API discovery; if no cluster is
      reachable, fall back to a pure-offline structural (YAML) check and verify
      no residual placeholder remains in the substituted copy.
    - _Requirements: R8.3, R11.3, R11.4_
  - [x] 10.5 Record what cannot be verified without provisioning
    - In the spec/README validation notes, explicitly list the live-only
      behaviors that CANNOT be verified in this phase (R11.5):
      real EKS private-endpoint connectivity from the runner; OIDC
      `AssumeRoleWithWebIdentity` against the real role and env-credential
      override of the instance profile; access-entry group mapping plus
      namespace-scoped RBAC authorization enforcement; an actual rollout and
      crash-loop detection; NAT egress reachability from the private subnet; and
      the HEAD-match + serialized-queue behavior against live concurrent runs.
    - _Requirements: R11.5_
    - Validation result: All live-only behaviors listed above remain
      unverified and are deferred to the operator bootstrap/live-test phase.

- [x] 11. Final checkpoint — validation complete
  - Ensure all runnable non-live validation tasks pass (or their fallbacks are
    documented), and confirm no live/apply/deploy/commit step was executed. Ask
    the user if questions arise.
  - Result: Non-live validation completed. No live provisioning,
    deployment, commit, or push was performed during this phase.

---

## Operator Bootstrap Prerequisites (documentation only — NOT executed)

> These are **operator runbook steps**, documented here and in the README. The
> coding agent MUST NOT execute them in this phase (no `terraform apply`, no live
> AWS, no `scripts/bootstrap-rbac.sh` run, no runner registration, no namespace
> creation, no secret configuration, no workflow run, no commit/push). They are
> reproduced here for traceability only and intentionally carry **no
> agent-actionable checkboxes**. This is NOT a numbered task.

1. **Provision infrastructure** — `terraform init/plan/apply` in
   `eks-terraform/envs/dev` to create network/ecr/eks/cicd including the new EKS
   access entry that maps the GitHub Actions role to the deployer group. (R10.2,
   step 1)
2. **Create the application namespace** — as the cluster-admin operator,
   `kubectl create namespace erudition` or `kubectl apply -f k8s/namespace.yaml`.
   The CI role intentionally cannot create it. (R5.5, R5.8, R10.2 step 2)
3. **Bind the deployer group (RBAC authorization)** — run
   `./scripts/bootstrap-rbac.sh` as the cluster-admin operator. It reads the
   `eks_deployer_group` Terraform output, renders `k8s/rbac-deployer.yaml` into a
   temporary copy, and applies the namespace-scoped Role + RoleBinding. Without
   this bind the access entry authenticates the role but authorizes nothing.
   (R5.2, R5.3, R10.2 step 2)
4. **Provision + register the self-hosted runner** — a stoppable/ephemeral small
   EC2 in a **private** subnet (no public IP), minimal instance profile
   (SSM-only; no `ecr:*`/`eks:*`), registered at the **repository** level with
   labels `self-hosted,linux,erudition-eks-dev` (no runner group — personal
   account); add a runner-SG -> cluster-SG `443` rule for the private API path.
   (R10.3)
5. **Configure GitHub repo config** — secrets `AWS_ROLE_ARN`
   (`module.cicd.github_actions_role_arn`) and `ECR_REPOSITORY_URL`
   (`module.ecr.ecr_repository_url`); variable `AWS_REGION`; ensure the repo is
   **private** and set fork-PR / outside-collaborator approval controls.
   (R10.2 step 3)
6. **Run + verify** — push to `main` (or `workflow_dispatch`); verify
   `kubectl -n erudition rollout status deploy/erudition-landing` and reach the
   page via `kubectl -n erudition port-forward svc/erudition-landing 8080:80`.
   **Teardown note:** deregister the runner, terminate the instance and delete
   its EBS volume, and remember the NAT gateway + EKS control plane keep billing
   until `terraform destroy`. (R10.1)

**Rollback runbook (manual):** `workflow_dispatch` with `deploy_sha=<old-sha>`
and `rollback=true`. The target image must already exist in ECR; the deploy
changes only the image reference (`kubectl set image`) and executes no old
application/workflow code. (R10.4)

---

## Notes

- Tasks marked with `*` are optional validation sub-tasks and can be skipped for
  a faster path, but R11 expects them before the spec is considered complete.
- The **Operator Bootstrap Prerequisites** section lists **operator bootstrap /
  live** actions and is explicitly **NOT** executed by the agent in this phase.
  It is documentation only and is not a numbered task (in particular, not "task
  8").
- Task 2.3 is CODE PREPARATION (writing the committed `k8s/rbac-deployer.yaml`
  manifest and `scripts/bootstrap-rbac.sh`); running the script against a live
  cluster is an operator step in the bootstrap section above.
- No property-based testing tasks are included: the design omits a Correctness
  Properties section because this is IaC + a workflow definition + `kubectl`
  orchestration (PBT inappropriate per the workflow guidance). Validation is
  non-live (fmt/validate/actionlint/dry-run).
- Each task references specific requirement clauses (R1–R11) for traceability.
- Checkpoints (tasks 9, 11) ensure incremental validation without any live step.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "6.1", "7"] },
    { "id": 1, "tasks": ["2.1", "6.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3", "6.3"] },
    { "id": 3, "tasks": ["4", "5", "6.4"] },
    { "id": 4, "tasks": ["6.5", "8"] },
    { "id": 5, "tasks": ["10.1"] },
    { "id": 6, "tasks": ["10.2", "10.3", "10.4", "10.5"] }
  ]
}
```
