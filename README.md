# Query Deps

A GitHub Action for querying dependencies with vlt. Gate your CI pipeline by checking for malware, outdated packages, license compliance, and more using powerful CSS-like selectors.

![Query Deps Action](https://img.shields.io/badge/Query%20Deps-by%20vlt-purple)
[![CI](https://github.com/vltpkg/query-deps/actions/workflows/ci.yml/badge.svg)](https://github.com/vltpkg/query-deps/actions/workflows/ci.yml)
[![Integration Tests](https://github.com/vltpkg/query-deps/actions/workflows/test.yml/badge.svg)](https://github.com/vltpkg/query-deps/actions/workflows/test.yml)

## Quick Start

```yaml
- name: Setup Node.js 22+
  uses: actions/setup-node@v4
  with:
    node-version: '22'

- name: Setup vlt
  uses: vltpkg/setup-vlt@v1

- name: Query dependencies
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      :malware --expect-results=0
      :outdated --view=json
      *:license(copyleft) --expect-results=0
```

## Features

✅ **Security Gates** — Block malware and verify package integrity  
✅ **License Compliance** — Ensure no copyleft or forbidden licenses  
✅ **Dependency Health** — Check for outdated, deprecated, or vulnerable packages  
✅ **Custom Queries** — Use CSS-like selectors for precise dependency filtering  
✅ **Rich Output** — JSON, human-readable, count, or Mermaid diagrams  
✅ **Multi-Query Support** — Run multiple checks in a single action  
✅ **GitHub Integration** — Beautiful summary tables and detailed output

## Use Cases

### Security Scanning

```yaml
- name: Security scan
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # Block any malware
      :malware --expect-results=0
      
      # Check for packages with known vulnerabilities
      :vulnerable --view=json
      
      # Ensure no deprecated packages
      :deprecated --expect-results=0
```

### License Compliance

```yaml
- name: License compliance
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # No copyleft licenses allowed
      *:license(copyleft) --expect-results=0
      
      # No GPL licenses
      *:license(gpl) --expect-results=0
      
      # List all unique licenses for review
      *:license(*) --view=json
```

### Dependency Management

```yaml
- name: Dependency health
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # Check for outdated packages
      :outdated --view=json
      
      # Ensure we don't have too many direct dependencies
      :root > * --view=count --expect-results=<=20
      
      # Find packages with specific scripts
      *:attr(scripts, [build]) --view=count
```

### Workspace Management

```yaml
- name: Workspace analysis
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # Count workspace packages
      :workspace --view=count
      
      # Find workspace deps with build scripts
      :workspace > *:attr(scripts, [build]) --view=json
      
      # Check for cross-workspace dependencies
      :workspace > *:workspace --view=count
```

### Package-Specific Checks

```yaml
- name: Specific package checks
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # Ensure lodash is present
      #lodash --expect-results=>=1
      
      # Check React version
      #react:semver(>=18.0.0) --expect-results=>=1
      
      # Find all @types packages
      #@types/* --view=count
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `query` | Single query selector (e.g. `:malware`) | No* | |
| `queries` | Multi-line query selectors with flags | No* | |
| `expect-results` | Expected result count for single query | No | |
| `view` | Output format: `human`, `json`, `mermaid`, `count` | No | `human` |
| `scope` | Scope query selector | No | |
| `target` | Target query selector (alternative to `query`) | No | |
| `working-directory` | Directory to run queries in | No | Repository root |

*Either `query` or `queries` must be provided.

### Expect Results Format

The `expect-results` parameter supports flexible comparisons:

- `0` — Exactly 0 results
- `5` — Exactly 5 results  
- `>0` — More than 0 results
- `>=1` — 1 or more results
- `<5` — Fewer than 5 results
- `<=10` — 10 or fewer results

## Outputs

| Output | Description |
|--------|-------------|
| `results` | JSON array of all query results |
| `passed` | `true` if all queries passed expectations |
| `result-0`, `result-1`, etc. | Individual query results as JSON |

## Query Selectors

Query Deps uses vlt's powerful CSS-like selectors. Here are common patterns:

| Selector | Description |
|----------|-------------|
| `:malware` | Packages flagged as malware |
| `:outdated` | Packages with newer versions available |
| `:deprecated` | Packages marked as deprecated |
| `:vulnerable` | Packages with known vulnerabilities |
| `:workspace` | Workspace packages |
| `:root` | Root package |
| `:peer` | Peer dependencies |
| `#package-name` | Specific package by name |
| `#@scope/*` | All packages in a scope |
| `*:license(mit)` | Packages with MIT license |
| `*:license(copyleft)` | Packages with copyleft licenses |
| `*:semver(>=2.0.0)` | Packages matching semver range |
| `:root > *` | Direct dependencies |
| `*:attr(scripts, [build])` | Packages with build script |

For complete selector documentation, see [vlt selector docs](https://docs.vlt.sh/cli/selectors).

## Advanced Examples

### Complex License Audit

```yaml
- name: License audit
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # Get all licenses for review
      *:license(*) --view=json > licenses.json
      
      # Block specific problematic licenses
      *:license(agpl) --expect-results=0
      *:license(gpl-2.0) --expect-results=0
      *:license(gpl-3.0) --expect-results=0
      
      # Warn about copyleft (but don't fail)
      *:license(copyleft) --view=count
```

### Security & Quality Gate

```yaml
- name: Security & quality gate
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # Security checks
      :malware --expect-results=0
      :vulnerable --expect-results=0
      
      # Quality checks  
      :deprecated --expect-results=0
      :outdated --view=count
      
      # Dependency limits
      :root > * --view=count --expect-results=<=50
      * --view=count --expect-results=<=500
```

### Workspace Health Check

```yaml
- name: Workspace health
  uses: vltpkg/query-deps@v1
  with:
    queries: |
      # Workspace structure
      :workspace --view=count --expect-results=>=1
      
      # Cross-workspace deps (should be minimal)
      :workspace > *:workspace --view=count --expect-results=<=5
      
      # Ensure workspace packages have required fields
      :workspace:attr(name) --expect-results=>=1
      :workspace:attr(version) --expect-results=>=1
```

## Error Handling

Query Deps provides clear error messages:

- **vlt not installed**: Points to `vltpkg/setup-vlt@v1`
- **Invalid selectors**: Shows vlt's error with helpful context
- **Expectation mismatches**: Clear comparison output
- **Syntax errors**: Detailed parsing feedback

## Requirements

- **Node.js 22+**: vlt requires Node.js >= 22.9.0
- **vlt installed**: Use `vltpkg/setup-vlt@v1` before this action
- **vlt project**: Must be run in a directory with vlt configuration

## Complete Workflow Example

```yaml
name: Dependency Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Setup vlt
        uses: vltpkg/setup-vlt@v1
      
      - name: Install dependencies
        run: vlt install
      
      - name: Security audit
        uses: vltpkg/query-deps@v1
        with:
          queries: |
            # Block malware and vulnerabilities
            :malware --expect-results=0
            :vulnerable --expect-results=0
            
            # License compliance
            *:license(copyleft) --expect-results=0
            *:license(agpl) --expect-results=0
            
            # Quality gates
            :deprecated --expect-results=0
            :root > * --view=count --expect-results=<=25
      
      - name: Generate dependency report
        uses: vltpkg/query-deps@v1
        with:
          queries: |
            # Detailed reports (won't fail CI)
            :outdated --view=json
            *:license(*) --view=json
            :workspace --view=mermaid
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

This action is licensed under the [MIT License](LICENSE).

---

**Query Deps** is built by the [vlt](https://vlt.sh) team. For more vlt tools and documentation, visit [docs.vlt.sh](https://docs.vlt.sh).