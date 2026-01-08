type DemoPageProps = {
  params: { id: string };
};

export default function DemoPage({ params }: DemoPageProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-semibold">Demo {params.id}</h2>
      <p className="text-sm text-ink">Demo link placeholder.</p>
    </section>
  );
}
