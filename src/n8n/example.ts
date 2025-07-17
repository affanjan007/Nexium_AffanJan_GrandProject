import { triggerN8nWebhook } from './client';

// Trigger the RecipeGenerator workflow in n8n
export async function triggerRecipeGenerator(message: string) {
  const n8nWebhookUrl = 'http://localhost:5678/webhook-test/recipe';
  const payload = { message };

  try {
    const result = await triggerN8nWebhook({
      url: n8nWebhookUrl,
      method: 'POST',
      payload,
    });
    console.log('n8n RecipeGenerator workflow triggered successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to trigger n8n RecipeGenerator workflow:', error);
    throw error;
  }
}

triggerRecipeGenerator('Hello from the app!');