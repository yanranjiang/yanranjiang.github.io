# DTU-Bench project page

> **Public project page.** Annotated main-benchmark examples: https://yanranjiang.github.io/dtu-bench/benchmark/ . The diagnostic archive contains 1,719 uploaded, checksum-verified videos. Main benchmark examples and engineering diagnostics are clearly separated.

Project section: https://yanranjiang.github.io/dtu-bench/

This public reader presents existing annotated diagnostic recordings, organized
by eight research questions. It is not a leaderboard or the complete formal
benchmark release. The individual-record archive includes controls, physical
references and explicitly labeled historical invalid records.

The publication inventory contains 676 rendered side-by-side comparisons and
1,043 annotated individual videos. Comparisons reuse source continuations;
these counts must not be interpreted as independent experimental sample sizes.
35 additional comparison records require review, while the individual archive
indexes 1,108 records including unavailable videos. Publication progress is
reported in `progress.json`; missing uploads are not robot failures.

## Hosting and provenance

GitHub Pages serves the small website and public evidence summaries. Video
files are GitHub Release assets, not large Git-tracked binaries. Each uploaded
file is checked by size and SHA-256 against the original annotated recording.
`media_manifest.json` contains the expected filenames, release tags, sizes and
hashes. `evidence/` and `receipts/` contain allowlisted public summaries, not the
private raw experiment logs. Machine paths and internal infrastructure metadata
are excluded. Formal benchmark data and original videos are unchanged.

The simulations use [LIBERO](https://github.com/Lifelong-Robot-Learning/LIBERO).
Model/pipeline qualification caveats remain applicable to these engineering
diagnostics. This public project page is identity-associated, not anonymous
review material. No conference acceptance or peer-review status is implied.

## Interpretation

- First finger contact is not necessarily a stable grasp.
- Ever, Held-10 and Final measure different properties.
- Goal attainment alone does not prove immediate behavioral redirection.
- Physical-reference success is not VLA adaptation success.
- Different scene/layout controls are not identical-state experiments.
- Reused controls, diagnostic budgets and valid/invalid status must be retained
  when interpreting outcomes.

The personal homepage is maintained independently and is not replaced by this
project section.
