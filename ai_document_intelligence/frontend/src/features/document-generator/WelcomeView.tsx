import { IconFileText } from '../../components/Icons';

const steps = [
  {
    title: 'Select Template',
    body: 'Choose from ECSS-compliant document templates in the sidebar',
  },
  {
    title: 'Provide Inputs',
    body: 'Enter test description, observations, and upload supporting files',
  },
  {
    title: 'Generate Document',
    body: 'AI generates structured content based on your inputs',
  },
  {
    title: 'Review & Export',
    body: 'Edit sections as needed and export to DOCX or PDF',
  },
];

export function WelcomeView() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8 py-16">
      <div className="flex max-w-lg flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <IconFileText className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">AI Document Generator</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Generate structured aerospace documentation from templates. Select a template from the sidebar, provide your inputs, and let AI create
          professional ECSS-compliant documents.
        </p>
      </div>

      <div className="my-12 w-full max-w-lg border-t border-slate-200" />

      <ol className="w-full max-w-lg space-y-6">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {i + 1}
            </div>
            <div>
              <p className="font-medium text-slate-900">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
