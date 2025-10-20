import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, input, version } = body

    if (!operation || !input) {
      return NextResponse.json(
        { error: 'Operation and input are required' },
        { status: 400 }
      )
    }

    let systemPrompt = ''
    let userPrompt = ''

    if (operation === 'generate') {
      systemPrompt = `You are creating phone system prompts that sound like real business phone systems. Write in a simple, conversational style that people are used to hearing when they call businesses.

Guidelines:
- Use simple, everyday language - avoid fancy words
- Sound natural and conversational, not formal or eloquent
- Write like typical phone systems: "Thanks for calling" not "Thank you for contacting"
- Be direct and to the point
- Use common phone system phrases like "please hold", "press 1", "leave a message"
- Avoid flowery language or sophisticated vocabulary
- Should sound like a real person speaking naturally
- Length should be appropriate for phone systems (typically 30-120 seconds when spoken)

Examples of good style:
- "Thanks for calling. Please hold while we connect you."
- "Hi, you've reached our office. We're closed right now."
- "Press 1 for sales, 2 for support"

Return only the phone prompt text, no additional commentary.`

      userPrompt = `Create a natural-sounding phone prompt for: ${input}`
    } else if (operation === 'polish') {
      systemPrompt = `You are editing phone system prompts to sound more like typical business phone systems. Make the text sound natural and conversational, like real phone systems people call every day.

Guidelines:
- Simplify fancy or eloquent language to everyday words
- Make it sound conversational, not formal
- Use common phone system phrases
- Remove unnecessary sophistication
- Keep the same information but make it sound more natural
- Fix any grammar issues but keep it conversational
- Should sound like a real person talking, not reading a script

Examples of changes:
- "We appreciate your patience" → "Thanks for waiting"
- "A representative will assist you momentarily" → "Someone will be with you shortly"
- "Please remain on the line" → "Please hold"

Return only the improved phone prompt text, no additional commentary.`

      userPrompt = `Make this phone prompt sound more natural and conversational:\n\n${input}`
    } else if (operation === 'generateFilename') {
      systemPrompt = `You are a helpful assistant that creates descriptive, professional filenames for phone system audio files.

Guidelines:
- Extract the main purpose/type from the text (e.g., customer_support, medical_clinic, sales_menu)
- Use lowercase with underscores
- Keep it concise but descriptive (3-5 words max)
- Include the version number provided
- Format: [purpose]_[type]_v[version].wav
- Examples: customer_support_menu_v1.wav, medical_afterhours_message_v1.1.wav, sales_hold_music_v2.wav

Return only the filename, no additional text or explanation.`

      userPrompt = `Generate a filename for this phone prompt (version ${version || '1'}):\n\n${input}`
    } else {
      return NextResponse.json(
        { error: 'Invalid operation. Use "generate", "polish", or "generateFilename"' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const generatedText = completion.choices[0]?.message?.content?.trim()

    if (!generatedText) {
      return NextResponse.json(
        { error: 'Failed to generate text' },
        { status: 500 }
      )
    }

    // Ensure the text doesn't exceed the TTS character limit
    const truncatedText = generatedText.length > 4096 
      ? generatedText.substring(0, 4096) 
      : generatedText

    return NextResponse.json({
      success: true,
      text: truncatedText,
      filename: operation === 'generateFilename' ? truncatedText : undefined,
      operation,
      originalLength: generatedText.length,
      truncated: generatedText.length > 4096
    })
  } catch (error) {
    console.error('AI Text Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    )
  }
}