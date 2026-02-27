export async function transcribeAudio(audioBuffer: ArrayBuffer, filename: string = 'audio.ogg'): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer]), filename)
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'text')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Whisper API error: ${error}`)
  }

  return response.text()
}
