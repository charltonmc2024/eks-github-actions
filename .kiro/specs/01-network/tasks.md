# 01 — Network Module Tasks

- [ ] 1. Review the connectivity options (NAT vs VPC endpoints) and record the
      chosen approach with its cost note in the module README/comments.
- [ ] 2. Create `eks-terraform/modules/network` with `variables.tf` (typed,
      described, validated) for VPC CIDR, subnet CIDRs, AZ usage, NAT toggle, and
      tags.
- [ ] 3. Define the VPC, two public subnets, two private subnets (using an AZ
      data source), and the Internet Gateway.
- [ ] 4. Define route tables and associations: public -> IGW; private -> chosen
      egress (NAT gateway behind `enable_nat_gateway`, or local-only with VPC
      endpoints).
- [ ] 5. Add EKS-required subnet tags where applicable.
- [ ] 6. Add outputs: `vpc_id`, `public_subnet_ids`, `private_subnet_ids`.
- [ ] 7. Wire the module into `eks-terraform/envs/dev` and provide dev values in
      `terraform.tfvars`.
- [ ] 8. Verify: `terraform fmt -recursive`, `terraform init`, `terraform
      validate`, `terraform plan` — plan shows only additions, no hardcoded
      identifiers, no public-IP nodes. (Stop at plan; do not apply.)

## Verification commands

```bash
cd eks-terraform/envs/dev
terraform fmt -check -recursive
terraform init
terraform validate
terraform plan
```
