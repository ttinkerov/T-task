'use client';

import { FormEvent, useState } from 'react';
import { usePublicFormQuery, useSubmitPublicFormMutation } from '../hooks';
import type { FormField } from '../types';

export function PublicFormFill({ token }: { token: string }) {
  const { data: form, isLoading, isError } = usePublicFormQuery(token);
  const submitMutation = useSubmitPublicFormMutation(token);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <main className="public-form">
        <p>Загрузка формы...</p>
      </main>
    );
  }

  if (isError || !form) {
    return (
      <main className="public-form">
        <p>Форма не найдена или недоступна.</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="public-form">
        <div className="public-form__card">
          <h1>Спасибо!</h1>
          <p>Ответ отправлен.</p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitMutation.mutateAsync(answers);
    setSubmitted(true);
  };

  return (
    <main className="public-form">
      <form onSubmit={handleSubmit} className="public-form__card">
        <h1 className="public-form__title">{form.title}</h1>
        {form.description ? <p className="public-form__desc">{form.description}</p> : null}

        <div className="public-form__fields">
          {form.fields.map((field) => (
            <PublicField
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(value) => setAnswers((current) => ({ ...current, [field.id]: value }))}
            />
          ))}
        </div>

        {submitMutation.error ? (
          <p className="text-sm text-red-400">{submitMutation.error.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitMutation.isPending || form.fields.length === 0}
          className="btn-primary public-form__submit"
        >
          {submitMutation.isPending ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </main>
  );
}

function PublicField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  if (field.type === 'LONG_TEXT') {
    return (
      <label className="task-drawer__field">
        <span>
          {field.label}
          {field.required ? ' *' : ''}
        </span>
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          className="glass-input task-drawer__textarea"
          rows={4}
          required={field.required}
        />
      </label>
    );
  }

  if (field.type === 'SINGLE_CHOICE') {
    return (
      <fieldset className="public-form__choice">
        <legend>
          {field.label}
          {field.required ? ' *' : ''}
        </legend>
        {field.options.map((option) => (
          <label key={option} className="public-form__choice-item">
            <input
              type="radio"
              name={field.id}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              required={field.required}
            />
            {option}
          </label>
        ))}
      </fieldset>
    );
  }

  if (field.type === 'MULTIPLE_CHOICE') {
    const selected = Array.isArray(value) ? value : [];

    return (
      <fieldset className="public-form__choice">
        <legend>
          {field.label}
          {field.required ? ' *' : ''}
        </legend>
        {field.options.map((option) => (
          <label key={option} className="public-form__choice-item">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => {
                if (event.target.checked) {
                  onChange([...selected, option]);
                } else {
                  onChange(selected.filter((item) => item !== option));
                }
              }}
            />
            {option}
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <label className="task-drawer__field">
      <span>
        {field.label}
        {field.required ? ' *' : ''}
      </span>
      <input
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        className="glass-input"
        required={field.required}
      />
    </label>
  );
}
