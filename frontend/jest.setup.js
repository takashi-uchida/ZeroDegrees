// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

jest.mock('d3', () => {
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
  const SVG_TAGS = new Set(['svg', 'g', 'circle', 'line', 'text'])

  const createElement = (parent, tagName) => {
    const shouldUseSvgNamespace =
      parent instanceof SVGElement || SVG_TAGS.has(tagName)

    return shouldUseSvgNamespace
      ? document.createElementNS(SVG_NAMESPACE, tagName)
      : document.createElement(tagName)
  }

  const resolveValue = (value, element, index) =>
    typeof value === 'function' ? value(element.__data__, index, [element]) : value

  class Selection {
    constructor(elements, parents = elements) {
      this.elements = elements
      this.parents = parents
    }

    selectAll(selector) {
      const matches = this.elements.flatMap((element) =>
        Array.from(element.querySelectorAll(selector))
      )

      return new Selection(matches, this.elements)
    }

    append(tagName) {
      const appendedElements = this.elements.map((element) => {
        const child = createElement(element, tagName)
        child.__data__ = element.__data__
        element.appendChild(child)
        return child
      })

      return new Selection(appendedElements)
    }

    attr(name, value) {
      this.elements.forEach((element, index) => {
        const resolvedValue = resolveValue(value, element, index)
        if (resolvedValue === undefined || resolvedValue === null) {
          return
        }
        element.setAttribute(name, String(resolvedValue))
      })

      return this
    }

    style(name, value) {
      this.elements.forEach((element, index) => {
        const resolvedValue = resolveValue(value, element, index)
        if (resolvedValue === undefined || resolvedValue === null) {
          return
        }
        element.style[name] = String(resolvedValue)
      })

      return this
    }

    on(eventName, handler) {
      this.elements.forEach((element) => {
        element.addEventListener(eventName, (event) => handler(event, element.__data__))
      })

      return this
    }

    call(fn, ...args) {
      if (typeof fn === 'function') {
        fn(this, ...args)
      }

      return this
    }

    data(dataArray) {
      return new DataJoin(this.parents, dataArray)
    }

    text(value) {
      this.elements.forEach((element, index) => {
        const resolvedValue = resolveValue(value, element, index)
        element.textContent = resolvedValue === undefined ? '' : String(resolvedValue)
      })

      return this
    }

    remove() {
      this.elements.forEach((element) => element.remove())
      return this
    }

    transition() {
      return new Transition(this.elements)
    }
  }

  class Transition {
    constructor(elements) {
      this.elements = elements
      this.durationMs = 0
    }

    duration(durationMs) {
      this.durationMs = durationMs
      return this
    }

    attr(name, value) {
      this.elements.forEach((element, index) => {
        const resolvedValue = resolveValue(value, element, index)
        if (resolvedValue === undefined || resolvedValue === null) {
          return
        }

        setTimeout(() => {
          element.setAttribute(name, String(resolvedValue))
        }, this.durationMs)
      })

      return this
    }
  }

  class DataJoin {
    constructor(parents, dataArray) {
      this.parents = parents
      this.dataArray = dataArray
    }

    enter() {
      return new EnterSelection(this.parents, this.dataArray)
    }
  }

  class EnterSelection {
    constructor(parents, dataArray) {
      this.parents = parents
      this.dataArray = dataArray
    }

    append(tagName) {
      const parent = this.parents[0]
      const appendedElements = this.dataArray.map((datum) => {
        const child = createElement(parent, tagName)
        child.__data__ = datum
        parent.appendChild(child)
        return child
      })

      return new Selection(appendedElements)
    }
  }

  const createZoomMock = () => {
    const zoom = jest.fn()
    zoom.scaleExtent = jest.fn(() => zoom)
    zoom.translateExtent = jest.fn(() => zoom)
    zoom.on = jest.fn(() => zoom)
    zoom.transform = jest.fn()
    return zoom
  }

  const createDragMock = () => {
    const drag = jest.fn()
    drag.on = jest.fn(() => drag)
    return drag
  }

  const createForceSimulationMock = () => {
    const simulation = {
      force: jest.fn(() => simulation),
      on: jest.fn((event, callback) => {
        if (event === 'tick' && typeof callback === 'function') {
          callback()
        }
        return simulation
      }),
      stop: jest.fn(),
      alphaTarget: jest.fn(() => simulation),
      restart: jest.fn(() => simulation),
    }

    return simulation
  }

  const createForceLinkMock = () => {
    const forceLink = {
      id: jest.fn(() => forceLink),
      distance: jest.fn(() => forceLink),
      strength: jest.fn(() => forceLink),
    }

    return forceLink
  }

  const createForceManyBodyMock = () => {
    const forceManyBody = {
      strength: jest.fn(() => forceManyBody),
    }

    return forceManyBody
  }

  const createForceCollideMock = () => {
    const forceCollide = {
      radius: jest.fn(() => forceCollide),
    }

    return forceCollide
  }

  const createLinearScale = () => {
    let domain = [0, 0.5, 1]
    let range = ['#000000', '#666666', '#ffffff']

    const scale = (value) => {
      if (value <= domain[0]) {
        return range[0]
      }
      if (value <= domain[1]) {
        return range[1]
      }
      return range[Math.min(range.length - 1, domain.length - 1)]
    }

    scale.domain = jest.fn((nextDomain) => {
      domain = nextDomain
      return scale
    })
    scale.range = jest.fn((nextRange) => {
      range = nextRange
      return scale
    })

    return scale
  }

  const createZoomIdentity = (x = 0, y = 0, k = 1) => ({
    x,
    y,
    k,
    translate(nextX, nextY) {
      return createZoomIdentity(nextX, nextY, this.k)
    },
    scale(nextK) {
      return createZoomIdentity(this.x, this.y, nextK)
    },
  })

  return {
    select: jest.fn((element) => new Selection([element])),
    zoom: jest.fn(() => createZoomMock()),
    zoomIdentity: createZoomIdentity(),
    drag: jest.fn(() => createDragMock()),
    forceSimulation: jest.fn(() => createForceSimulationMock()),
    forceLink: jest.fn(() => createForceLinkMock()),
    forceManyBody: jest.fn(() => createForceManyBodyMock()),
    forceCenter: jest.fn(() => ({})),
    forceCollide: jest.fn(() => createForceCollideMock()),
    scaleLinear: jest.fn(() => createLinearScale()),
  }
})
