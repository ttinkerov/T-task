import { PublicFormFill } from '@/features/forms';

export default async function PublicFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicFormFill token={token} />;
}
