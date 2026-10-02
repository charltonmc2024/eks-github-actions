# schema.tf — documentation only. No resources are declared in this file.
#
# This file documents the single-table design for the Erudition Solution App_Table.
# Every application entity is stored in one DynamoDB table; item types are
# distinguished by their PK/SK key patterns and an application-level entityType
# attribute. The key structure is driven by the 16 developer-defined access
# patterns (AP1–AP16), not by an entity-to-table mapping, so every read is served
# by a Query or GetItem against the primary key or a secondary index — with zero
# table scans and zero read-path filter expressions.

# ── What Terraform declares vs. what the application writes ────────────────────
#
# (a) Terraform-declared Key_Attributes (dynamodb.tf, all type String "S"):
#       PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK
#
# (b) Terraform-managed indexes (dynamodb.tf):
#       GSI1  — item-bank index      (keys on item PARAMS items only)
#       GSI2  — teacher-reporting index (keys on Result items only)
#
# (c) Schemaless Application_Item_Fields (written by the application at runtime;
#     NOT declared as DynamoDB attributes because DynamoDB is schemaless for
#     non-key fields):
#       entityType, studentId, score, theta, stdErr, completedAt,
#       masteryBySkill, gradeLevel, dueDate, and others as the application needs.

# ── Single-table entity / key model ───────────────────────────────────────────
# Entity                    PK                     SK
# Student profile           STUDENT#<sid>          PROFILE
# Enrollment                STUDENT#<sid>          ENROLL#<classId>
# Assignment (student view) STUDENT#<sid>          ASSIGN#<due>#<assignId>
# Mastery per skill         STUDENT#<sid>          MASTERY#<skillId>
# Result (student)          STUDENT#<sid>          RESULT#<completedAt>#<assignId>
# Session meta              SESSION#<sessId>       META
# Ability estimate          SESSION#<sessId>       ABILITY
# Response                  SESSION#<sessId>       RESP#<seq>
# Seen-items set            SESSION#<sessId>       SEEN
# Item content              ITEM#<itemId>          CONTENT
# Item parameters           ITEM#<itemId>          PARAMS      (carries GSI1 keys)
# Class meta                CLASS#<cid>            META
# Class roster entry        CLASS#<cid>            STUDENT#<sid>
# Class assignment          CLASS#<cid>            ASSIGN#<assignId>
# Teacher profile           TEACHER#<tid>          PROFILE
# Teacher's classes         TEACHER#<tid>          CLASS#<cid>
# Audit record              AUDIT#<sid>            <timestamp>#<actorId>

# ── GSI1 encoding (item PARAMS items only) ─────────────────────────────────────
# GSI1PK = "SKILL#<skillId>#<gradeLevel>"
# GSI1SK = "DIFF#<zero-padded-difficulty>#<itemId>"

# ── GSI2 encoding (Result items only) ──────────────────────────────────────────
# GSI2PK = "ASSIGN#<assignmentId>"
# GSI2SK = "RESULT#<studentId>"
# Projection INCLUDE: studentId, score, completedAt, masteryBySkill

# ── Difficulty encoding rule ───────────────────────────────────────────────────
# GSI1SK difficulty segment = "DIFF#" + zero-pad( (b + 3.0) * 100 , width 4 )
#   b = -3.0  ->  DIFF#0000
#   b =  0.0  ->  DIFF#0300
#   b = +3.0  ->  DIFF#0600
# Zero-padding to a fixed width makes lexical (string) sort order equal numeric
# difficulty order, so a BETWEEN on GSI1SK selects a difficulty band directly.

# ── Key-construction conventions ───────────────────────────────────────────────
# - The "#" character separates key segments.
# - Sortable numeric values are zero-padded to a fixed width so lexical string
#   order equals numeric order.
# - Timestamps use ISO-8601 so they sort correctly as strings.
# - Every item carries an entityType attribute as an application convention; it is
#   NOT a Terraform-declared key attribute.

# ── Access-pattern traceability (AP1–AP16) ─────────────────────────────────────
# Every access pattern is served by exactly one construct — the base table
# primary key, GSI1, or GSI2 — using exactly one of Query, GetItem, PutItem, or
# UpdateItem. No access pattern uses a table Scan or a read-path filter
# expression. Range reads within a partition use a sort-key range condition
# (begins_with or BETWEEN), never a filter.
#
# AP    Description                          Serving construct   Operation & key condition
# AP1   Session state                        Base table          Query PK = SESSION#<id>
# AP2   Write response                       Base table          PutItem PK = SESSION#<id>, SK = RESP#<seq>
# AP3   Read/update ability                  Base table          GetItem/UpdateItem PK = SESSION#<id>, SK = ABILITY (strongly consistent)
# AP4   Candidate items                      GSI1                Query GSI1PK = SKILL#<s>#<g>, GSI1SK BETWEEN difficulty band
# AP5   One item (CONTENT + PARAMS)          Base table          Query PK = ITEM#<id>
# AP6   All responses in order               Base table          Query PK = SESSION#<id>, SK begins_with RESP#
# AP7   Student profile                      Base table          GetItem PK = STUDENT#<id>, SK = PROFILE
# AP8   Student's assignments (newest first) Base table          Query PK = STUDENT#<id>, SK begins_with ASSIGN#, ScanIndexForward = false
# AP9   Students in a class                  Base table          Query PK = CLASS#<id>, SK begins_with STUDENT#
# AP10  Class results for an assignment      GSI2                Query GSI2PK = ASSIGN#<id>
# AP11  Student's results over time          Base table          Query PK = STUDENT#<id>, SK begins_with RESULT#
# AP12  Mastery by skill                     Base table          Query PK = STUDENT#<id>, SK begins_with MASTERY#
# AP13  Teacher's classes                    Base table          Query PK = TEACHER#<id>, SK begins_with CLASS#
# AP14  Class's assignments                  Base table          Query PK = CLASS#<id>, SK begins_with ASSIGN#
# AP15  Item-bank admin                      GSI1                Query GSI1 over the full difficulty range (min->max GSI1SK)
# AP16  Audit trail                          Base table          Query PK = AUDIT#<studentId>
#
# All 16 are mapped, none left unmapped, each to exactly one serving construct.
# The range reads AP4, AP6, AP8, AP11, AP12, AP14, and AP15 all use
# begins_with/BETWEEN on the sort key. No key or index exists whose sole purpose
# is an access pattern outside AP1–AP16.
