import { useEffect } from 'react'

const SITE = 'https://growkynos.com'

function setMeta(selector, attr, value) {
  if (!value) return
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [key, val] = selector.replace(/^meta\[|\]$/g, '').split('=')
    el.setAttribute(key, val.replace(/"/g, ''))
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Route-level document head management. Kept dependency-free so the bundle
 * stays lean; every route declares its own title, description and canonical.
 */
export function useSEO({ title, description, path = '/', image = '/og.svg', type = 'website' }) {
  useEffect(() => {
    if (title) document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', `${SITE}${path}`)
    setMeta('meta[property="og:type"]', 'content', type)
    setMeta('meta[property="og:image"]', 'content', `${SITE}${image}`)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', `${SITE}${image}`)
    setLink('canonical', `${SITE}${path}`)
  }, [title, description, path, image, type])
}
