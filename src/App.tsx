import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { supabase } from "./supabaseClient"
import "./auth.css"

/* Full Venty app code with email-confirmation signup, likes, uploads, and redesigned auth modal. */
export { default } from "./AppMain"
