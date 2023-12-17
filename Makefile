SHELL := bash
MAKEFLAGS += --warn-undefined-variables

.DELETE_ON_ERROR:

version = $(shell jq -r '.version' package.json)
.DEFAULT_GOAL := ci
is_ci := $(shell if [ -n "$(GITHUB_ACTIONS)" ]; then echo 'true'; else echo 'false'; fi)

node-bin-dir := ./node_modules/.bin
nx = $(node-bin-dir)/$(1)

very-clean: clean
	rm -rf dist target node_modules/ package-lock.json
.PHONY: very-clean

clean:
	rm -rf dist target/lint target/test target/build
.PHONY: clean

install: | target/install
target/install:
ifeq ($(is_ci), true)
	npm ci
else
	npm install
endif
	mkdir -p $(@D) && touch $@
.PHONY: install

lint: | install target/lint
target/lint:
	npm run lint
	mkdir -p $(@D) && touch $@
.PHONY: lint

build: | install target/build
target/build:
	npm run build
	npm run depcheck
	mkdir -p $(@D) && touch $@
.PHONY: build

test: | build target/test
target/test:
ifeq ($(is_ci), true)
	npm test -- --coverage
else
	npm test
endif
	mkdir -p $(@D) && touch $@
.PHONY: test

# --- ci

ci: | install lint build test
.PHONY: ci
