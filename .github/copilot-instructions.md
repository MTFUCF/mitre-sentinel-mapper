# Copilot instructions for MITRE Sentinel Mapper

MITRE Sentinel Mapper is a focused cybersecurity portfolio project owned by Matthew Faber. The goal is straightforward: A static mapping tool that will relate ATT&CK techniques to Sentinel-friendly detection concepts, KQL ideas, and investigation notes so learners can connect offense knowledge to defender workflow. Deployment target is GitHub Pages. The stack is HTML5, CSS3, Vanilla JavaScript, KQL mapping notes, GitHub Pages. Keep the repo easy to review, easy to explain in an interview, and easy to deploy from a clean branch.

When helping here, bias toward the smallest useful implementation. Preserve the deliberate no-build-step approach for the frontend. If the project uses Azure Functions, keep Node tooling isolated to `api/` and do not introduce root-level package management. Prefer plain HTML, CSS, and vanilla JavaScript that a recruiter can understand quickly by opening the repo.

What Copilot should help with:
- Build a clean mapping UI that lets one technique connect to multiple Sentinel ideas.
- Keep KQL and detection notes short, reviewable, and clearly marked as starter guidance.
- Preserve a static-first structure even as the mapping dataset grows.

Domain guardrail: This project is about analyst thinking and mapping, not pretending to ship enterprise detection content. Keep examples cautious and educational. Treat copy, labels, and examples as reviewable cybersecurity content, not filler text.

What to avoid:
- Do not imply that a single technique always maps to one definitive KQL rule.
- Do not overpromise production-grade detections in a study project.
- Do not add backend complexity unless the project scope changes materially.

Keep README examples, testing steps, and placeholder UI text aligned whenever scope changes. This project has no secret-bearing runtime configuration in-repo. If you add data files later, keep them human-readable and stable so Matthew or another reviewer can audit the content without reverse engineering generated output.
