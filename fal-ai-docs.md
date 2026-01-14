here's the fal ai code for:
video generation:
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/veo3.1/fast/first-last-frame-to-video", {
  input: {
    prompt: "A woman looks into the camera, breathes in, then exclaims energetically, \"have you guys checked out Veo3.1 First-Last-Frame-to-Video on Fal? It's incredible!\"",
    aspect_ratio: "auto",
    duration: "8s",
    resolution: "720p",
    generate_audio: true,
    first_frame_url: "https://storage.googleapis.com/falserverless/example_inputs/veo31-flf2v-input-1.jpeg",
    last_frame_url: "https://storage.googleapis.com/falserverless/example_inputs/veo31-flf2v-input-2.jpeg"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);



nano banana pro (with images as reference):
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
  input: {
    prompt: "make a photo of the man driving the car down the california coastline",
    num_images: 1,
    aspect_ratio: "auto",
    output_format: "png",
    image_urls: ["https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png", "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"],
    resolution: "1K"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);


nanobanana pro (without image reference):
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana-pro", {
  input: {
    prompt: "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater.",
    num_images: 1,
    aspect_ratio: "1:1",
    output_format: "png",
    resolution: "1K"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);

seedream 4.5 (reference images):
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/edit", {
  input: {
    prompt: "Replace the product in Figure 1 with that in Figure 2. For the title copy the text in Figure 3 to the top of the screen, the title should have a clear contrast with the background but not be overly eye-catching.",
    image_size: "auto_4K",
    num_images: 1,
    max_images: 1,
    enable_safety_checker: true,
    image_urls: ["https://storage.googleapis.com/falserverless/example_inputs/seedreamv45/seedream_v45_edit_input_1.png", "https://storage.googleapis.com/falserverless/example_inputs/seedreamv45/seedream_v45_edit_input_2.png", "https://storage.googleapis.com/falserverless/example_inputs/seedreamv45/seedream_v45_edit_input_3.png"]
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);

seedream 4.5 (no reference image):
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/text-to-image", {
  input: {
    prompt: "A selfie of a cat, with the cat as the protagonist. The setting is twilight at the Eiffel Tower. The cat is happy, holding a piece of baklava in its paw. The photo has a slight motion blur and is slightly overexposed. From a selfie angle, with a bit of motion blur, the overall image presents a sense of calm madness. The text \"Seedream 4.5 is on fal\" should be written on the picture at the top in clearly visible font and crisp lettering. The image has a 4:3 aspect ratio",
    image_size: "auto_2K",
    num_images: 1,
    max_images: 1,
    enable_safety_checker: true
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);

