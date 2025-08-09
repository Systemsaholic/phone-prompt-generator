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
      systemPrompt = `You are a professional copywriter specializing in phone system prompts. Create clear, professional, and engaging phone prompts that are optimized for 3CX and other business phone systems.

Guidelines:
- Keep language clear and professional
- Use appropriate pacing with natural pauses
- Include specific instructions when relevant (press 1, press 2, etc.)
- Make prompts friendly but concise
- Ensure compatibility with phone audio quality
- Length should be appropriate for phone systems (typically 30-120 seconds when spoken)
- Focus on user experience and clear communication

Return only the phone prompt text, no additional commentary.`

      userPrompt = `Create a professional phone prompt for: ${input}`
    } else if (operation === 'polish') {
      systemPrompt = `You are a professional copywriter specializing in phone system prompts. Improve and polish the provided text to make it more professional, clear, and suitable for business phone systems.

Guidelines:
- Maintain the original intent and key information
- Improve clarity and professionalism
- Ensure natural flow and pacing for spoken audio
- Fix grammar and enhance word choice
- Make it sound more engaging while keeping it professional
- Ensure compatibility with phone system requirements
- Keep the same general length unless improvement requires changes

Return only the improved phone prompt text, no additional commentary.`

      userPrompt = `Polish this phone prompt text:\n\n${input}`
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