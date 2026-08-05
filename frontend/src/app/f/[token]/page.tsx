import { PublicFormFill } from '@/features/forms/components/public-form-fill';

export default async function PublicFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicFormFill token={token} />;
}
