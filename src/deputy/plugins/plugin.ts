export interface PluginConfig<Options extends { endpoint: string }> {
  name: string
  defaultOptions?: Options
}

export class Plugin<Options extends { endpoint: string }> {
  name: string
  options: Options
  config: PluginConfig<Options>

  constructor(config?: Partial<PluginConfig<Options>>) {
    const { name = '', defaultOptions = { endpoint: '' } as Options } = config || {}

    this.name = name
    this.options = defaultOptions
    this.config = { name, defaultOptions } as PluginConfig<Options>
  }

  static create<O extends { endpoint: string }>(config?: Partial<PluginConfig<O>>): Plugin<O> {
    return new Plugin<O>(config)
  }

  configure(options?: Partial<Options>): Plugin<Options> {
    this.options = { ...this.options, ...options }
    return this
  }
}

// const OpenAIChat = Plugin.create({
//   name: 'openai-chat',
// })

// OpenAIChat.configure({
//   endpoint: 'https://api.openai.com/v1/engines/davinci-codex/completions',
// })
