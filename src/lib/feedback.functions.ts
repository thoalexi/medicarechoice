import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const feedbackSchema = z.object({
  category: z.enum(["broken", "idea", "confusing", "other"]),
  message: z.string().trim().min(1, "Please tell us a little more.").max(2000, "Please keep it under 2,000 characters."),
  email: z
    .string()
    .trim()
    .max(255, "Email must be under 255 characters.")
    .email("That email doesn't look right.")
    .optional()
    .or(z.literal("")),
  page: z.string().trim().max(200).optional(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((data) => feedbackSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient(
      process.env["VITE_SUPABASE_URL"]!,
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );
    const { error } = await supabase.from("feedback").insert({
      category: data.category,
      message: data.message,
      email: data.email || null,
      page: data.page || null,
    });
    if (error) throw new Error("Could not save your feedback. Please try again.");
    return { ok: true };
  });
