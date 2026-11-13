// EXPORTS: IMovement, MOCK_MOVEMENTS
export interface IMovement {
  id: string
  name: string
  category: 'cardio' | 'strength' | 'flexibility' | 'daily'
  met: number // 代谢当量值
  intensity: 'low' | 'medium' | 'high'
}

export const MOCK_MOVEMENTS: IMovement[] = [
  { id: '1', name: '慢走(散步)', category: 'daily', met: 2.5, intensity: 'low' },
  { id: '2', name: '快走(6km/h)', category: 'cardio', met: 5.0, intensity: 'medium' },
  { id: '3', name: '跑步(8km/h)', category: 'cardio', met: 8.3, intensity: 'high' },
  { id: '4', name: '慢跑(9.6km/h)', category: 'cardio', met: 9.8, intensity: 'high' },
  { id: '5', name: '跳绳(中速)', category: 'cardio', met: 10.0, intensity: 'high' },
  { id: '6', name: '游泳(自由泳)', category: 'cardio', met: 8.3, intensity: 'high' },
  { id: '7', name: '骑行(16km/h)', category: 'cardio', met: 6.8, intensity: 'medium' },
  { id: '8', name: '爬楼梯', category: 'cardio', met: 7.0, intensity: 'high' },
  { id: '9', name: '椭圆机(中速)', category: 'cardio', met: 5.0, intensity: 'medium' },
  { id: '10', name: '划船机(中等)', category: 'cardio', met: 7.0, intensity: 'high' },
  { id: '11', name: '力量训练(轻量)', category: 'strength', met: 3.5, intensity: 'low' },
  { id: '12', name: '力量训练(大重量)', category: 'strength', met: 6.0, intensity: 'high' },
  { id: '13', name: '哑铃全身训练', category: 'strength', met: 5.0, intensity: 'medium' },
  { id: '14', name: '自重训练(俯卧撑等)', category: 'strength', met: 4.8, intensity: 'medium' },
  { id: '15', name: 'HIIT高强度间歇', category: 'strength', met: 8.0, intensity: 'high' },
  { id: '16', name: '瑜伽(哈他)', category: 'flexibility', met: 2.5, intensity: 'low' },
  { id: '17', name: '普拉提', category: 'flexibility', met: 3.0, intensity: 'low' },
  { id: '18', name: '拉伸放松', category: 'flexibility', met: 2.3, intensity: 'low' },
  { id: '19', name: '羽毛球(休闲)', category: 'cardio', met: 5.5, intensity: 'medium' },
  { id: '20', name: '篮球(半场)', category: 'cardio', met: 6.0, intensity: 'medium' }
]
