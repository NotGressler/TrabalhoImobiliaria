"use client";
import RequireAuth from "../../auth/RequireAuth";
import ShowcasePage from "../../components/ShowcasePage";
export default function ClientPage() { return <RequireAuth role="USER"><ShowcasePage clientArea /></RequireAuth>; }
