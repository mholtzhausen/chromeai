export async function ask(query, context, system = 'You are a helpful assistant') {
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

  console.log({ query, context, system })
  // TODO: Implement actual API call logic here
}