
import { useState } from 'react'
import './App.css'
import { config } from './config'
import { codigosWmo } from './codigosWmo'

import termometro from './assets/icones/termometro.svg'
import uv from './assets/icones/uv.svg'
import porSol from './assets/icones/por-sol.svg'
import nascerSol from './assets/icones/nascer-sol.svg'
import vento from './assets/icones/vento.svg'
import busca from './assets/icones/busca.svg'
import neve from './assets/icones/neve.svg'
import tempestade from './assets/icones/tempestade.svg'
import sol from './assets/icones/sol.svg'
import nublado from './assets/icones/nublado.svg'
import chuva from './assets/icones/chuva.svg'
import chuvaGota from './assets/icones/chuva-gota.svg'
import umidade from './assets/icones/umidade.svg'

function App() {
  const [buscaCidade, setBuscaCidade] = useState('')
  const [cidade, setCidade] = useState(null)
  const [clima, setClima] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const cidades = [
    'Florianópolis',
    'São Paulo',
    'Rio de Janeiro',
    'Brasília',
    'Salvador',
    'Porto Alegre',
  ]

  function obterImagem(codigo) {
    if ([0, 1].includes(codigo)) return sol
    if ([2, 3, 45, 48].includes(codigo)) return nublado
    if ([71, 73, 75].includes(codigo)) return neve
    if ([95, 96, 99].includes(codigo)) return tempestade
    return chuva
  }

  function obterCondicao(codigo) {
    const condicao = codigosWmo.find(
      (item) => item.codigo === codigo,
    )

    return {
      descricao: condicao
        ? condicao.descricao
        : 'Condição desconhecida',
      imagem: obterImagem(codigo),
    }
  }

  function formatarData(data) {
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}`
  }

  function obterDia(data, indice) {
    if (indice === 0) return 'Hoje'
    if (indice === 1) return 'Amanhã'

    return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
    })
  }

  function formatarHorario(data) {
    return data ? data.slice(11, 16) : '--:--'
  }

  async function buscarClima(nomeCidade) {
    const nome = nomeCidade.trim()

    if (!nome) {
      setErro('Digite o nome de uma cidade para pesquisar.')
      return
    }

    setCarregando(true)
    setErro('')
    setClima(null)
    setCidade(null)
    setBuscaCidade(nome)

    try {
      const urlCidade =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`

      const respostaCidade = await fetch(urlCidade)

      if (!respostaCidade.ok) {
        throw new Error('Não foi possível localizar a cidade.')
      }

      const dadosCidade = await respostaCidade.json()

      if (!dadosCidade.results || dadosCidade.results.length === 0) {
        throw new Error('Cidade não encontrada. Tente outro nome.')
      }

      const resultado = dadosCidade.results[0]

      const parametros = new URLSearchParams({
        latitude: resultado.latitude,
        longitude: resultado.longitude,
        current: [
          'temperature_2m',
          'apparent_temperature',
          'relative_humidity_2m',
          'wind_speed_10m',
          'precipitation',
          'weather_code',
          'uv_index',
        ].join(','),
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_probability_max',
          'sunrise',
          'sunset',
        ].join(','),
        forecast_days: '10',
        timezone: 'auto',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
      })

      const urlClima =
        `https://api.open-meteo.com/v1/forecast?${parametros}`

      const respostaClima = await fetch(urlClima)

      if (!respostaClima.ok) {
        throw new Error('Não foi possível carregar os dados meteorológicos.')
      }

      const dados = await respostaClima.json()

      if (!dados.current || !dados.daily) {
        throw new Error('A API não retornou os dados esperados.')
      }

      setCidade(resultado)
      setClima(dados)
    } catch (error) {
      setErro(error.message || 'Erro ao carregar os dados. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    buscarClima(buscaCidade)
  }

  const atual = clima?.current
  const previsao = clima?.daily

  return (
    <div className="pagina">
      <header className="header">
        <div className="header-conteudo">
          <div className="logo">
            <img src={config.logo} alt="Logo Sol Chuva" />
            <h1>{config.nome}</h1>
          </div>

          <p>Previsão do tempo em tempo real</p>
        </div>
      </header>

      <main className="container">
        <section className="apresentacao">
          <span className="subtitulo">PREVISÃO METEOROLÓGICA</span>
          <h2>Como está o tempo hoje?</h2>
          <p>
            Consulte o clima atual e acompanhe a previsão dos próximos dez dias.
          </p>
        </section>

        <section className="pesquisa">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              list="lista-cidades"
              placeholder="Digite o nome de uma cidade..."
              value={buscaCidade}
              onChange={(event) => setBuscaCidade(event.target.value)}
            />

            <datalist id="lista-cidades">
              {cidades.map((nome) => (
                <option key={nome} value={nome} />
              ))}
            </datalist>

            <button type="submit" disabled={carregando}>
              <img src={busca} alt="" />
              {carregando ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          <div className="cidades-rapidas">
            <span>Pesquisas rápidas:</span>

            {cidades.map((nome) => (
              <button
                key={nome}
                type="button"
                disabled={carregando}
                onClick={() => buscarClima(nome)}
              >
                {nome}
              </button>
            ))}
          </div>
        </section>

        {carregando && (
          <div className="mensagem carregando">
            <div className="spinner"></div>
            <p>Carregando dados do clima...</p>
          </div>
        )}

        {erro && (
          <div className="mensagem erro">
            {erro}
          </div>
        )}

        {clima && cidade && (
          <>
            <section className="clima-atual">
              <div className="cidade-info">
                <div>
                  <h2>{cidade.name}</h2>
                  <p>
                    {cidade.admin1 ? `${cidade.admin1} — ` : ''}
                    {cidade.country}
                  </p>
                </div>

                <span className="horario-atual">
                  Atualizado às {formatarHorario(atual.time)}
                </span>
              </div>

              <div className="conteudo-clima">
                <div className="temperatura-principal">
                  <img
                    className="icone-grande"
                    src={obterCondicao(atual.weather_code).imagem}
                    alt={obterCondicao(atual.weather_code).descricao}
                  />

                  <div>
                    <h3>{Math.round(atual.temperature_2m)}°C</h3>
                    <p>
                      {obterCondicao(atual.weather_code).descricao}
                    </p>
                  </div>
                </div>

                <div className="detalhes-clima">
                  <div className="detalhe">
                    <img src={termometro} alt="" />
                    <span>Sensação</span>
                    <strong>
                      {Math.round(atual.apparent_temperature)}°C
                    </strong>
                  </div>

                  <div className="detalhe">
                    <img src={umidade} alt="" />
                    <span>Umidade</span>
                    <strong>{atual.relative_humidity_2m}%</strong>
                  </div>

                  <div className="detalhe">
                    <img src={vento} alt="" />
                    <span>Vento</span>
                    <strong>{atual.wind_speed_10m} km/h</strong>
                  </div>

                  <div className="detalhe">
                    <img src={chuvaGota} alt="" />
                    <span>Precipitação</span>
                    <strong>{atual.precipitation} mm</strong>
                  </div>

                  <div className="detalhe">
                    <img src={uv} alt="" />
                    <span>Índice UV</span>
                    <strong>{atual.uv_index}</strong>
                  </div>

                  <div className="detalhe">
                    <div className="horarios-icones">
                      <img src={nascerSol} alt="" />
                      <img src={porSol} alt="" />
                    </div>
                    <span>Nascer / Pôr do sol</span>
                    <strong>
                      {formatarHorario(previsao.sunrise[0])} / {formatarHorario(previsao.sunset[0])}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="previsao">
              <div className="titulo-secao">
                <h2>Previsão para os próximos 10 dias</h2>
              </div>

              <div className="lista-previsao">
                {previsao.time.map((data, indice) => {
                  const condicao = obterCondicao(
                    previsao.weather_code[indice],
                  )

                  return (
                    <article className="card-previsao" key={data}>
                      <div className="dia-previsao">
                        <strong>{obterDia(data, indice)}</strong>
                        <small>{formatarData(data)}</small>
                      </div>

                      <img
                        className="icone-previsao"
                        src={condicao.imagem}
                        alt={condicao.descricao}
                      />

                      <p className="descricao-previsao">
                        {condicao.descricao}
                      </p>

                      <div className="temperaturas">
                        <strong>
                          {Math.round(previsao.temperature_2m_max[indice])}°
                        </strong>
                        <span>
                          {Math.round(previsao.temperature_2m_min[indice])}°
                        </span>
                      </div>

                      <div className="chuva-previsao">
                        <img src={chuvaGota} alt="" />
                        {previsao.precipitation_probability_max[indice] ?? '--'}%
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} {config.nome} - Todos os direitos reservados.
        </p>
        <span>Dados meteorológicos fornecidos pela Open-Meteo.</span>
      </footer>
    </div>
  )
}

export default App
