import { test, expect } from '@playwright/test';

test.describe('Phone Prompt Generator - TTS Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Phone Prompt Generator")');
  });

  test('should generate audio in Basic Mode', async ({ page }) => {
    console.log('Starting Basic Mode test...');
    
    // Ensure we're on the Generate Audio tab
    const generateTab = page.locator('button[role="tab"]:has-text("Generate Audio")');
    await generateTab.click();
    
    // Select Basic Mode if not already selected
    const basicModeButton = page.locator('button:has-text("Basic Mode")').first();
    await basicModeButton.click();
    
    // Fill in the text
    const testText = 'Hello, thank you for calling. This is a test of the basic text to speech system.';
    const textArea = page.locator('textarea[placeholder*="Enter your phone system prompt"]');
    await textArea.fill(testText);
    
    // Select a voice (keep default "alloy")
    const voiceSelect = page.locator('select').first();
    await expect(voiceSelect).toBeVisible();
    
    // Set speed (keep default 1.0)
    const speedSlider = page.locator('input[type="range"]');
    await expect(speedSlider).toBeVisible();
    
    // Set a custom filename
    const filenameInput = page.locator('input[placeholder*="my_phone_prompt.mp3"]');
    await filenameInput.fill('test_basic_mode.mp3');
    
    // Click Generate Audio button
    const generateButton = page.locator('button:has-text("Generate Audio")');
    await generateButton.click();
    
    // Wait for the generation to complete (looking for the audio element or success message)
    console.log('Waiting for audio generation...');
    const audioPlayer = page.locator('audio');
    await expect(audioPlayer).toBeVisible({ timeout: 30000 });
    
    // Verify the download button appears
    const downloadButton = page.locator('button:has-text("Download")');
    await expect(downloadButton).toBeVisible();
    
    // Verify the audio URL is present
    const audioSource = await audioPlayer.locator('source').getAttribute('src');
    expect(audioSource).toBeTruthy();
    expect(audioSource).toContain('/audio/');
    
    console.log('✅ Basic Mode test completed successfully');
  });

  test('should generate audio in Advanced Mode', async ({ page }) => {
    console.log('Starting Advanced Mode test...');
    
    // Ensure we're on the Generate Audio tab
    const generateTab = page.locator('button[role="tab"]:has-text("Generate Audio")');
    await generateTab.click();
    
    // Select Advanced Mode
    const advancedModeButton = page.locator('button:has-text("Advanced Mode")').first();
    await advancedModeButton.click();
    
    // Wait for advanced mode interface to load
    await page.waitForSelector('text=Advanced Mode', { timeout: 5000 });
    
    // Fill in the text
    const testText = 'Welcome to our automated phone system. Please listen carefully as our menu options have changed.';
    const textArea = page.locator('textarea[placeholder*="Enter your phone system prompt"]');
    await textArea.fill(testText);
    
    // Select a voice
    const voiceSelect = page.locator('select').first();
    await voiceSelect.selectOption('nova');
    
    // Select some voice characteristics
    const professionalButton = page.locator('button:has-text("Professional")');
    await professionalButton.click();
    
    const slowClearButton = page.locator('button:has-text("Slow and Clear")');
    await slowClearButton.click();
    
    // Add custom instructions
    const customInstructions = page.locator('textarea[placeholder*="Southern drawl"]');
    await customInstructions.fill('Speak clearly with good enunciation for a phone system');
    
    // Set a custom filename
    const filenameInput = page.locator('input[placeholder*="my_advanced_prompt.mp3"]');
    await filenameInput.fill('test_advanced_mode.mp3');
    
    // Click Generate Advanced Audio button
    const generateButton = page.locator('button:has-text("Generate Advanced Audio")');
    await generateButton.click();
    
    // Wait for the generation to complete
    console.log('Waiting for advanced audio generation...');
    const audioPlayer = page.locator('audio');
    await expect(audioPlayer).toBeVisible({ timeout: 30000 });
    
    // Verify the download button appears
    const downloadButton = page.locator('button:has-text("Download")');
    await expect(downloadButton).toBeVisible();
    
    // Verify the audio URL is present
    const audioSource = await audioPlayer.locator('source').getAttribute('src');
    expect(audioSource).toBeTruthy();
    expect(audioSource).toContain('/audio/');
    
    console.log('✅ Advanced Mode test completed successfully');
  });

  test('should use a template and generate audio', async ({ page }) => {
    console.log('Starting Template test...');
    
    // Go to Templates tab
    const templatesTab = page.locator('button[role="tab"]:has-text("Templates")');
    await templatesTab.click();
    
    // Wait for templates to load
    await page.waitForSelector('text=Available Templates', { timeout: 5000 });
    
    // Select the Voicemail Greeting template
    const voicemailTemplate = page.locator('button:has-text("Voicemail Greeting")').first();
    await voicemailTemplate.click();
    
    // Fill in the template variables
    await page.waitForSelector('text=Fill in Variables');
    
    const companyNameInput = page.locator('input').filter({ hasText: /company/i }).first();
    await companyNameInput.fill('Acme Corporation');
    
    const agentNameInput = page.locator('input').filter({ hasText: /agent/i }).first();
    await agentNameInput.fill('John Smith');
    
    // Apply the template
    const applyButton = page.locator('button:has-text("Apply Template")');
    await applyButton.click();
    
    // Should automatically switch to Generate Audio tab
    await page.waitForSelector('textarea[placeholder*="Enter your phone system prompt"]');
    
    // Verify the template text was applied
    const textArea = page.locator('textarea[placeholder*="Enter your phone system prompt"]');
    const textContent = await textArea.inputValue();
    expect(textContent).toContain('Acme Corporation');
    expect(textContent).toContain('John Smith');
    
    // Generate audio with the template text
    const generateButton = page.locator('button:has-text("Generate Audio")');
    await generateButton.click();
    
    // Wait for generation
    console.log('Waiting for template-based audio generation...');
    const audioPlayer = page.locator('audio');
    await expect(audioPlayer).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Template test completed successfully');
  });

  test('should show generation in history', async ({ page }) => {
    console.log('Starting History test...');
    
    // First, generate a quick audio
    const testText = 'History test audio';
    const textArea = page.locator('textarea[placeholder*="Enter your phone system prompt"]');
    await textArea.fill(testText);
    
    const generateButton = page.locator('button:has-text("Generate Audio")');
    await generateButton.click();
    
    // Wait for generation to complete
    const audioPlayer = page.locator('audio');
    await expect(audioPlayer).toBeVisible({ timeout: 30000 });
    
    // Go to History tab
    const historyTab = page.locator('button[role="tab"]:has-text("History")');
    await historyTab.click();
    
    // Wait for history to load
    await page.waitForSelector('text=Generation History', { timeout: 5000 });
    
    // Check if our generation appears in history
    const historyItem = page.locator('text=History test audio').first();
    await expect(historyItem).toBeVisible();
    
    // Verify action buttons are present
    const playButton = page.locator('button[title="Play"]').first();
    await expect(playButton).toBeVisible();
    
    const downloadButton = page.locator('button[title="Download"]').first();
    await expect(downloadButton).toBeVisible();
    
    const deleteButton = page.locator('button[title="Delete"]').first();
    await expect(deleteButton).toBeVisible();
    
    console.log('✅ History test completed successfully');
  });
});