'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Product } from '@/lib/db.types'

function daysBetween(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
}

export function calcRentalPrice(product: Product, startDate: string, endDate: string) {
  const days = daysBetween(startDate, endDate)
  const daily = Number(product.rental_price_daily) || 0
  const weekly = Number(product.rental_price_weekly) || 0
  const monthly = Number(product.rental_price_monthly) || 0

  let total = 0
  let remaining = days

  if (monthly > 0) {
    const months = Math.floor(remaining / 30)
    total += months * monthly
    remaining -= months * 30
  }
  if (weekly > 0) {
    const weeks = Math.floor(remaining / 7)
    total += weeks * weekly
    remaining -= weeks * 7
  }
  total += remaining * daily

  return { total, days }
}

export interface CartItem {
  id: string
  product: Product
  type: 'buy' | 'rent'
  quantity: number
  rentalStart?: string
  rentalEnd?: string
  rentalDays?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) {
      try { setItems(JSON.parse(stored)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  function addItem(item: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      }
      return [...prev, item]
    })
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateQuantity(id: string, qty: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const totalPrice = items.reduce((sum, i) => {
    if (i.type === 'buy') return sum + i.product.price * i.quantity
    const { total } = calcRentalPrice(i.product, i.rentalStart!, i.rentalEnd!)
    return sum + total * i.quantity
  }, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
