import { Box, Paper, Stack, Typography } from '@mui/material'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import MovieRoundedIcon from '@mui/icons-material/MovieRounded'
import FolderZipRoundedIcon from '@mui/icons-material/FolderZipRounded'
import { FormatChip } from './FormatChip'
import { getFormat } from '../../config/conversions'

// Icon shown inside the small sticker badge, chosen by format family.
const KIND_ICON = {
  image: ImageRoundedIcon,
  document: DescriptionRoundedIcon,
  media: MovieRoundedIcon,
  other: FolderZipRoundedIcon,
}

function MetaRow({ label, value }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  )
}

/**
 * Explainer card for one format. Always shows the format's friendly name and
 * a short description. When `meta` is provided (a file is selected), it also
 * lists file details below the description.
 *
 * `horizontal` lays the header beside the description (icon+name left, text
 * right) — used when the card is shown solo at full width, so it doesn't look
 * like a stretched tall card.
 */
export function FormatCard({ formatId, meta, horizontal = false }) {
  const format = getFormat(formatId)
  const Icon = KIND_ICON[format.kind] ?? ImageRoundedIcon

  const header = (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: 'center', flexShrink: 0, ...(horizontal ? { minWidth: 200 } : { mb: 2 }) }}
    >
      <FormatChip
        formatId={formatId}
        size="icon"
        icon={<Icon sx={{ color: 'text.primary', fontSize: 26 }} />}
      />
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
          {format.label}
        </Typography>
        {format.name && (
          <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: 14 }}>
            {format.name}
          </Typography>
        )}
      </Box>
    </Stack>
  )

  const body = format.description && (
    <Typography
      sx={{ color: 'text.primary', fontWeight: 500, lineHeight: 1.55, fontSize: 16 }}
    >
      {format.description}
    </Typography>
  )

  return (
    <Paper
      sx={{
        p: { xs: 2.5, md: 3.5 },
        transition: 'background-color 240ms ease',
        height: '100%',
      }}
    >
      {horizontal ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 4 }}
          sx={{ alignItems: { sm: 'center' } }}
        >
          {header}
          {body}
        </Stack>
      ) : (
        <>
          {header}
          {body}
        </>
      )}

      {meta && (
        <Box sx={{ mt: 2.5 }}>
          {Object.entries(meta).map(([label, value]) => (
            <MetaRow key={label} label={label} value={value} />
          ))}
        </Box>
      )}
    </Paper>
  )
}
