const { test, expect } = require('@playwright/test');

test('VAL-22092', async ({ page }) => {
    await page.goto('http://fordringshaverportal-dock43.inddr.dk');
    await page.getByRole('button', { name: 'Log ind med NemID' }).click();
    await page.locator('div').filter({ hasText: 'Pick user to log in' }).nth(2).click();
    await page.getByRole('option', { name: 'FP_MOVIA - MOVIA MOVIA' }).click();
    await page.locator('#superlink').getByRole('button', { name: 'Login PSRM' }).click();
    //await page.goto('http://fordringshaverportal-dock43.inddr.dk/hoeringer');
    await page.getByRole('button', { name: 'Opret fordring' }).click();
    await page.getByRole('button', { name: 'Oprettelsesscenarie' }).click();
    await page.getByRole('button', { name: 'Én eller flere relaterede fordringer til en fordring under inddrivelse' }).click();
    await page.getByRole('radio').first().check();
    await page.getByPlaceholder('Indtast').nth(2).click();
    await page.getByPlaceholder('Indtast').nth(2).fill('0505799895');
    await page.getByPlaceholder('Indtast navn på skyldner her').click();
    await page.getByPlaceholder('Indtast navn på skyldner her').fill('SKAT Inddrivelse Test Person 11225');
    await page.getByRole('button', { name: 'Tilføj hæfter' }).click();
    await page.getByRole('button', { name: 'Næste' }).click();

    await page.getByRole('button', { name: 'Renteregel' }).click();
    await page.getByRole('button', { name: 'BLANKT' }).click();
    await page.getByRole('button', { name: 'Rentesatskode' }).click();

    //test
    await expect(page).toHaveScreenshot("1.png", { maxDiffPixels: 20000 });

    await page.locator('#DropDownRentesRegel1').click();
    await page.getByRole('button', { name: '001 = RIM beregner og tilskriver renter' }).click();
    await page.getByRole('button', { name: 'Rentesatskode' }).click();

    //test
    await expect(page).toHaveScreenshot("2.png", { maxDiffPixels: 20000 });

    await page.getByRole('button', { name: '001 = RIM beregner og tilskriver renter' }).click();
    await page.getByRole('button', { name: '002 = Fordringshaver beregner og indsender inddrivelsesrenter' }).click();
    await page.getByRole('button', { name: 'Rentesatskode' }).click();

    //test
    await expect(page).toHaveScreenshot("3.png", { maxDiffPixels: 20000 });
});