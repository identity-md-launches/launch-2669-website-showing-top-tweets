# Submission path budget

Explicit budget for the new `.gitignore`: exclude generated `**/node_modules/`, `**/.vite/`, `**/.cache/`, `**/coverage/`, `**/playwright-report/`, `**/test-results/`, `**/*.tsbuildinfo`, and `test/scratch/` at every relevant nesting level. They are generated dependencies, caches, or disposable check evidence, not deliverables. `dist/` and `artifacts/` are explicitly included, before the nested generated-file exclusions, so export and evidence are retained even if a parent ignore pattern would omit them. The exclusions remain effective at every nesting level.

Maximum submission allocation: source/config/lockfile/scripts 700 KiB; public runtime assets 2,048 KiB; complete static export 2,800 KiB; documentation and validation artifacts 800 KiB. Total budget 6,348 KiB, leaving 1,844 KiB below the assignment's 8 MiB limit. Required runtime assets and `dist/` must remain complete. Actual size is recorded after final validation.
