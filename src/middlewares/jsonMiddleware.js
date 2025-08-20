import express from 'express'

/** JSON middleware */
export function jsonMiddleware() {
    return [express.json(), express.urlencoded({ extended: true })]
}
