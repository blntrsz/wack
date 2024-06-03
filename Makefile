deploy:
	@pnpm run --filter=@asgard/infra cdk deploy pipeline --require-approval never

manypkg_check:
	@pnpm manypkg check

manypkg_fix:
	@pnpm manypkg fix

lint: manypkg_check

lint_fix: manypkg_fix

build:
	@pnpm run --filter=@asgard/infra cdk synth

