PYTHON ?= python3

.PHONY: audit build check clean list bump release syntax

audit:
	$(PYTHON) tools/audit_userscripts.py

build:
	$(PYTHON) tools/build_userscripts.py

check:
	$(PYTHON) tools/build_userscripts.py --check
	$(PYTHON) tools/check_userscripts_syntax.py

syntax:
	$(PYTHON) tools/check_userscripts_syntax.py

clean:
	rm -rf dist

list:
	$(PYTHON) tools/build_userscripts.py --list

bump:
ifndef SCRIPT
	$(error SCRIPT is required, for example: make bump SCRIPT=pimpmyshoutbox VERSION=3.0.33)
endif
ifndef VERSION
	$(error VERSION is required, for example: make bump SCRIPT=pimpmyshoutbox VERSION=3.0.33)
endif
	$(PYTHON) tools/bump_version.py $(SCRIPT) $(VERSION)

release: bump build
