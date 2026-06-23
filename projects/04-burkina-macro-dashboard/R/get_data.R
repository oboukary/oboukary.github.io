# Récupération des indicateurs macroéconomiques du Burkina Faso
# Sources : World Bank Open Data API (api.worldbank.org) + FRED (fred.stlouisfed.org)

suppressPackageStartupMessages({
  library(jsonlite)
  library(dplyr)
  library(purrr)
  library(readr)
})

wb_indicator <- function(indicator, country = "BFA", start = 1990, end = 2026, retries = 3) {
  url <- sprintf(
    "https://api.worldbank.org/v2/country/%s/indicator/%s?format=json&per_page=20000&date=%d:%d",
    country, indicator, start, end
  )
  raw <- NULL
  for (attempt in seq_len(retries)) {
    raw <- tryCatch(fromJSON(url, flatten = TRUE), error = function(e) NULL)
    ok <- !is.null(raw) && length(raw) >= 2 && !is.null(raw[[2]]) && is.data.frame(raw[[2]]) && nrow(raw[[2]]) > 0
    if (ok) break
    Sys.sleep(1.5 * attempt)  # back-off avant nouvelle tentative
  }
  if (is.null(raw) || length(raw) < 2 || is.null(raw[[2]]) || !is.data.frame(raw[[2]]) || nrow(raw[[2]]) == 0) {
    return(tibble(year = integer(), value = numeric()))
  }
  df <- raw[[2]]
  tibble(year = as.integer(df$date), value = as.numeric(df$value)) |>
    filter(!is.na(value)) |>
    arrange(year)
}

fred_series <- function(series_id, retries = 3) {
  url <- sprintf("https://fred.stlouisfed.org/graph/fredgraph.csv?id=%s", series_id)
  raw <- NULL
  for (attempt in seq_len(retries)) {
    raw <- tryCatch(
      suppressWarnings(suppressMessages(read_csv(url, show_col_types = FALSE))),
      error = function(e) NULL
    )
    if (!is.null(raw) && nrow(raw) > 0) break
    Sys.sleep(1.5 * attempt)
  }
  if (is.null(raw) || nrow(raw) == 0) return(tibble(year = integer(), value = numeric()))
  names(raw) <- c("date", "value")
  raw |>
    mutate(
      year = as.integer(substr(as.character(date), 1, 4)),
      value = suppressWarnings(as.numeric(value))
    ) |>
    filter(!is.na(value)) |>
    select(year, value) |>
    arrange(year)
}

# ── World Bank : indicateurs structurels (couverture la plus large pour le BFA) ──
wb_codes <- c(
  pib_usd            = "NY.GDP.MKTP.CD",
  pib_par_habitant   = "NY.GDP.PCAP.CD",
  croissance_pib     = "NY.GDP.MKTP.KD.ZG",
  inflation_ipc      = "FP.CPI.TOTL.ZG",
  inflation_deflateur = "NY.GDP.DEFL.KD.ZG",
  population         = "SP.POP.TOTL",
  croissance_pop     = "SP.POP.GROW",
  acces_electricite  = "EG.ELC.ACCS.ZS",
  taux_chomage       = "SL.UEM.TOTL.ZS",
  taux_ouverture     = "NE.TRD.GNFS.ZS",
  exportations_pib   = "NE.EXP.GNFS.ZS",
  importations_pib   = "NE.IMP.GNFS.ZS",
  ide_net_pib        = "BX.KLT.DINV.WD.GD.ZS",
  industrie_pib      = "NV.IND.TOTL.ZS",
  manufacture_pib    = "NV.IND.MANF.ZS",
  agriculture_pib    = "NV.AGR.TOTL.ZS",
  services_pib       = "NV.SRV.TOTL.ZS"
)

wb_data <- imap_dfr(wb_codes, function(code, name) {
  wb_indicator(code) |> mutate(serie = name, source = "World Bank")
})

# ── FRED : séries complémentaires (recoupement PIB/inflation + séries propres à FRED) ──
fred_codes <- c(
  pib_usd_fred       = "MKTGDPBFA646NWDB",
  pib_par_hab_fred   = "PCAGDPBFA646NWDB",
  inflation_ipc_fred = "FPCPITOTLZGBFA",
  dette_exterieure   = "BFADGGDPPT",
  taux_change_fcfa   = "XRNCUSBFA618NRUG"
)

fred_data <- imap_dfr(fred_codes, function(code, name) {
  fred_series(code) |> mutate(serie = name, source = "FRED")
})

macro_data <- bind_rows(wb_data, fred_data)

dir.create(here::here("projects", "04-burkina-macro-dashboard", "data"), showWarnings = FALSE, recursive = TRUE)
write_csv(macro_data, here::here("projects", "04-burkina-macro-dashboard", "data", "macro_data.csv"))
saveRDS(macro_data, here::here("projects", "04-burkina-macro-dashboard", "data", "macro_data.rds"))
