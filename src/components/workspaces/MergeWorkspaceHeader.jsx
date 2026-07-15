import { Box, Paper, Typography } from '@mui/material'
import { StickerToggle } from '../common/StickerToggle'

/**
 * The three merge-family operations, shown as an in-header switcher so users can
 * move between them without opening the nav menu (mirrors how convert/compress
 * let you switch targets in-place). `op` values match the merge menu config.
 */
const MERGE_OPS = [
  { value: 'merge-pdf', label: 'Merge', sticker: 'lilac' },
  { value: 'split-pdf', label: 'Split', sticker: 'mint' },
  { value: 'reorder-pdf', label: 'Edit pages', sticker: 'peach' },
]

/**
 * Shared header card for the merge-family workspaces (merge / split / edit).
 * Shows a lilac sticker icon, the operation title, and a one-line subtitle.
 *
 * When `op` + `onChangeOp` are provided, a sticker toggle is rendered so the
 * user can switch between the three merge operations right from the header.
 *
 * Layout: on wide screens the icon sits centered beside the whole text block
 * with the toggle pushed to the right. On mobile the icon stays beside the
 * TITLE only, the subtitle flows full-width below, and the toggle wraps under.
 */
export function MergeWorkspaceHeader({ icon, title, subtitle, op, onChangeOp }) {
  const iconBox = (
    <Box
      sx={(t) => ({
        width: 44,
        height: 44,
        borderRadius: '12px',
        bgcolor: t.morph.stickers.lilac,
        border: `2px solid ${t.morph.sticker.peel}`,
        boxShadow: t.morph.sticker.shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      })}
    >
      {icon}
    </Box>
  )

  return (
    <Paper
      sx={{
        p: { xs: 2.5, md: 3 },
        display: 'flex',
        // Stack on mobile (icon+title, then subtitle, then toggle); go inline on
        // sm+ so the icon centers beside the text and the toggle sits at the end.
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 2.5 },
      }}
    >
      {/* On sm+ the icon is a standalone flex item; on xs it moves inside the
          title row below (rendered there), so hide this copy on xs. */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>{iconBox}</Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        {/* Icon + title share a row on mobile; on sm+ the icon lives outside
            this block (above), so only the title shows here. */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>{iconBox}</Box>
          <Typography component="h1" sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{ color: 'text.secondary', fontWeight: 500, mt: { xs: 1, sm: 0.25 } }}>
          {subtitle}
        </Typography>
      </Box>

      {op && onChangeOp && (
        <StickerToggle
          ariaLabel="Merge operation"
          value={op}
          onChange={onChangeOp}
          size="small"
          options={MERGE_OPS}
          // Left-aligned under the text on mobile, inline at the row's end on
          // sm+. Pills wrap if the row runs out of room so "Edit pages" stays
          // intact and evenly padded.
          sx={{ flexShrink: 0, flexWrap: 'wrap', rowGap: 1, p: 0, ml: { xs: -0.5, sm: 0 } }}
        />
      )}
    </Paper>
  )
}
