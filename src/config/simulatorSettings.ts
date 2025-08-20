export interface SimulatorSettings {
  defaultDateTime?: {
    date: string // YYYY-MM-DD format
    time: number // hours (e.g., 16.9 for 16:54)
  }
}

export const simulatorSettings: SimulatorSettings = {
  defaultDateTime: {
    date: '2024-08-11',
    time: 16.9  // 16:54
  }
}