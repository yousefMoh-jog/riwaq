export function educationalLevelLabel(level: string | undefined): string {
  switch (level) {
    case 'preparatory': return 'إعدادي';
    case 'secondary': return 'ثانوي';
    case 'university': return 'جامعي';
    default: return level ?? 'ثانوي';
  }
}

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'حدث خطأ. يرجى المحاولة مرة أخرى.';
}
