import calculatorData from '../../text/5_calculator.json' with { type: 'json' };
import type { PageContent } from '../types/content';

let cachedCalculatorPage: PageContent | null = null;

export async function loadCalculatorPageContent(): Promise<PageContent> {
  if (cachedCalculatorPage) return cachedCalculatorPage;

  try {
    const response = await fetch('/text/5_calculator.json', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      cachedCalculatorPage = data.calculator_page as PageContent;
      return cachedCalculatorPage;
    }
  } catch (err) {
    console.warn('Falling back to bundled 5_calculator.json:', err);
  }

  cachedCalculatorPage = (calculatorData as any).calculator_page as PageContent;
  return cachedCalculatorPage;
}
