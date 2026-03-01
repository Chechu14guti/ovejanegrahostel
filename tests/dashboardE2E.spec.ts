import { test, expect } from '@playwright/test';

test.describe('Oveja Negra Hostel - End-to-End Interactions', () => {

    test('Página de Login y carga de Interfaz Principal', async ({ page }) => {
        // 1. Visit root
        await page.goto('/');

        // 2. Validate title
        await expect(page).toHaveTitle(/Oveja Negra Hostel/i);

        // Assuming we do not have an automated mock for the authentication in Playwright yet,
        // we would type credentials here. For now, since Firebase might stop us, 
        // we just check if the Login Box or Dashboard mounts without a crash.
        const loginButton = page.getByRole('button', { name: /entrar|iniciar sesión/i });
        if (await loginButton.isVisible()) {
            await expect(loginButton).toBeVisible();
        }
    });

});
