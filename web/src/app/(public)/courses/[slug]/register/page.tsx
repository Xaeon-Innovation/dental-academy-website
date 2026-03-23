import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Full registration form removed; enrollment is on the course page (Secure Your Spot). */
export default async function RegisterPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/courses/${slug}`);
}
