// 配置：舒尔特方格

export const gridSizes = [3, 5, 7, 9]

export const modeOptions = [
  { value: 'number', label: '数字模式' },
  { value: 'color', label: '多色数字' },
  { value: 'reverse', label: '降序模式' }
]

export const timeLimitMap = {
  3: 15,
  5: 30,
  7: 60,
  9: 90
}

// 设置选项配置
export const settingsConfig = {
  sections: {
    assist: {
      title: '辅助选项',
      options: ['highlightShown']
    }
  },
  options: {
    highlightShown: {
      label: '显示进度提示（初学者建议开启）',
      default: true,
      description: '已点击的数字将被高亮显示',
      storageKey: 'schulte_highlight_shown'
    }
  }
}
