import { cn } from '@/lib/utils'

export default function ManifestSeal({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-primary/40 text-primary',
        className,
      )}
    >
      <span className="font-mono text-[10px] tracking-widest">DL</span>
    </div>
  )
}
