import { ask } from "./lib/openai.mjs"

export async function queryAssistant(query, context, system = 'You are a helpful assistant') {
  // Verify the shape of the context
  if (!context || typeof context !== 'object') {
    throw new Error('Context must be an object')
  }

  if (context.web && typeof context.web !== 'string') {
    throw new Error('Web context must be a string URL')
  }

  if (context.selection && typeof context.selection !== 'string') {
    throw new Error('Selection context must be a string')
  }

  if (!Array.isArray(context.messages)) {
    context.messages = []
  }

  console.log({ query, context, system })
  let _system = [system]

  if (context.web) {
    _system.push(`Contextual Information:\n---\n${context.web}\n---`)
  }
  if (context.selection) {
    _system.push(`Contextual Information:\n---\n${context.selection}\n---`)
  }

  let answer = await ask(query, {
    system: _system.join('\n'),
    messages: context.messages
  })
  return answer
}