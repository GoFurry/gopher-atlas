export async function copyText(text: string, documentRef: Document = document): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textarea = documentRef.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  documentRef.body.append(textarea)
  textarea.select()

  const result = typeof documentRef.execCommand === 'function' ? documentRef.execCommand('copy') : false
  textarea.remove()
  return result
}
