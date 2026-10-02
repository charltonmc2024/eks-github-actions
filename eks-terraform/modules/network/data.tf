# Look up the region's availability zones so subnet placement is portable across
# regions instead of hardcoding "<region>a"/"<region>b" suffixes. Indexing the
# first two AZs keeps the two-AZ layout while letting the module work in any
# region whose AZ names do not follow the a/b pattern.
data "aws_availability_zones" "available" {
  state = "available"
}
