import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Legacy success URL; enrollment completes on the course page. */
export default async function RegistrationSuccessPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/courses/${slug}`);
}
