# OpenClaw Polymath Demo Teleprompter

This is Polymath running inside OpenClaw.

First, I am using local visual memory. I already indexed my image and video
library, so I do not have to re-upload or rebuild the RAG set for this demo.
OpenClaw can ask Polymath for media matches, pull back images, video segments,
paths, and metadata, then use those results to write real content.

Here is the workflow: I search for a scene, OpenClaw gets the best visual
matches from my local library, and then I ask it to turn those matches into ad
copy, captions, or a post. It is not generic prompt output. It is grounded in
the actual media on this machine.

Now the GPU side. Polymath also exposes Mneme GPU controls through OpenClaw.
Before I kick off a render or another local model workflow, I can check VRAM,
release the GPU, evacuate Ollama models, and reclaim the lease afterward.

That matters because creators are constantly switching between search, writing,
image generation, video tools, and local models. This gives them a button and a
tool call to clear VRAM instead of hunting through terminals.

So the demo is three things in one flow: local photo and video RAG, content
generation from those media results, and GPU memory control from OpenClaw.

This is available as the Polymath Visual Memory package on ClawHub, with more
skills and Mneme resources at mneme.nepa-ai.com and axon.nepa-ai.com.
