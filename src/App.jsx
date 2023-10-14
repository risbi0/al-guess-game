/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import names from './assets/names.json'
import './App.css'

function App() {
	const img = useRef()
	const input = useRef()
	const loopProgress = useRef() // for animating progress bar
	const deadline = useRef() // deadline for each round
	const ogInput = useRef('')
	const optionsParent = useRef()
	const namePool = useRef([])
	const pickedIndices = useRef([]) // stores indices of shown ships

	const [includeRetrofit, setIncludeRetrofit] = useState(false)
	const [includeSkin, setIncludeSkin] = useState(false)
	const [normalMode, setNormalMode] = useState()
	const [endlessMode, setEndlessMode] = useState()
	const [eventEnabled, setEventEnabled] = useState(true) // disable event during answer display
	const [shipName, setShipName] = useState('') // main ship name
	const [isCorrectAnswer, setIsCorrectAnswer] = useState(null)
	const [gameRunning, setGameRunning] = useState()
	const [gameEnd, setGameEnd] = useState()
	const [rounds, setRounds] = useState()
	const [progress, setProgress] = useState(0) // progress bar
	const [suggestions, setSuggestions] = useState([])
	const [optionIndex, setOptionIndex] = useState(-1) // for highlighting options
	const [strikes, setStrikes] = useState(0)
	const [endRound, setEndRound] = useState(false)

	const [score, setScore] = useState()
	const [avgSpeed, setAvgSpeed] = useState()
	const [answerLog, setAnswerLog] = useState([])

	const delay = () => new Promise(resolve => setTimeout(resolve, 1000))
	const setInputText = (e) => input.current.value = e.target.textContent
	const toggleRetrofit = () => setIncludeRetrofit((includeRetrofit) => !includeRetrofit)
	const toggleSkin = () => setIncludeSkin((includeSkin) => !includeSkin)

	function caesarCipher(str) {
		const shift = 42
		const alphabet = 'abcdefghijklmnopqrstuvwxyz'
		let output = ''
		for (let i = 0; i < str.length; i++) {
			const char = str[i]
			if (alphabet.includes(char.toLowerCase())) {
				const index = alphabet.indexOf(char.toLowerCase())
				const newIndex = (index + shift) % 26
				const isUpperCase = char === char.toUpperCase()
				output += isUpperCase
					? alphabet[newIndex].toUpperCase()
					: alphabet[newIndex]
			} else {
				output += char
			}
		}
		return output
	}

	function showSuggestions() {
		const suggestions = namePool.current
			.filter((word) => word.toLowerCase().includes(input.current.value.toLowerCase()))
			.map((word) => word.replace('_Default', '').replace('_', ' '))
		setSuggestions(suggestions)
	}

	function loadImage(url) {
		return new Promise((resolve, reject) => {
			const image = new Image()
			image.onload = () => resolve(image)
			image.onerror = (error) => reject(error)
			image.src = url
		})
	}

	function displayCorrectAnswer(isCorrect) {
		clearInterval(loopProgress.current)
		clearTimeout(deadline.current)
		setEventEnabled(false)

		loadImage(`https://raw.githubusercontent.com/risbi0/al-guess-game-images/main/img/unhidden/${btoa(caesarCipher(shipName))}.png`)
			.then((image) => {
				img.current.src = image.src
				setIsCorrectAnswer(isCorrect)
				// show unhidden ship for a sec before going to next round
				return delay()
			})
			.then(() => {
				input.current.value = ''
				setEventEnabled(true)
				setProgress(0)
				if (endlessMode && !isCorrect) setStrikes((wrongAnswers) => wrongAnswers + 1)
				if (endlessMode && pickedIndices.current.length === namePool.current.length) {
					setEndRound(true)
				} else {
					setRounds((rounds) => rounds + 1)
					newGameRound()
				}
			})
	}

	function highlightOptions(e) {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
      setOptionIndex((index) => {
				if (index === -1) ogInput.current = input.current.value
				let indexOut
				if (index < suggestions.length - 1) {
					indexOut = index + 1
				}  else {
					indexOut = index
				}
				input.current.value = suggestions.length > 0 ? suggestions[indexOut] : ogInput.current
				return indexOut
			})
    } else if (e.key === 'ArrowUp') {
			e.preventDefault()
      setOptionIndex((index) => {
				let indexOut
				if (index > 0) {
					indexOut = index - 1
				}  else {
					indexOut = -1
				}
				input.current.value = index > 0 ? suggestions[indexOut] : ogInput.current
				return indexOut
			})
    } else if (e.key === 'Enter' && optionIndex !== -1) {
			submitAnswer()
    }
	}

	function submitAnswer() {
		setSuggestions([])
		setOptionIndex(-1) // reset index for option selection
		checkAnswer()
	}

	function checkAnswer() {
		const answer = input.current.value
		if (eventEnabled) {
			if (answer === shipName.replace('_Default', '').replace('_', ' ')) {
				// correct answer
				setScore((score) => score + 1)
				displayCorrectAnswer(true)
			} else {
				// incorrect answer
				displayCorrectAnswer(false)
			}
		}
  }

	function buildNamePool() {
		namePool.current = []
		names.forEach((name) => {
			namePool.current.push(`${name['filename']}_Default`)
			if (includeRetrofit && name['retrofit']) namePool.current.push(`${name['filename']}_Retrofit`)
			if (includeSkin && name['skins'].length > 0) namePool.current.push(...name['skins'].map((skin) => `${name['filename']}_${skin}`))
		})
	}

	function newGameRound() {
		setIsCorrectAnswer(null)

		// pick new hidden ship
		let newShipPicked = false, randShipIndex
		while (!newShipPicked) {
			randShipIndex = Math.floor(Math.random() * namePool.current.length)

			if (!pickedIndices.current.includes(randShipIndex)) {
				pickedIndices.current.push(randShipIndex)
				newShipPicked = true
			}
		}
		setShipName(namePool.current[randShipIndex])
	}

	function startGame(startNormal, startEndless) {
		setNormalMode(startNormal)
		setEndlessMode(startEndless)
		// reinit states
		pickedIndices.current = []
		setGameRunning(true)
		setGameEnd(false)
		setEndRound(false)
		setRounds(1)
		setStrikes(0)
		setOptionIndex(-1)

		setScore(0)
		setAvgSpeed(0)
		setAnswerLog([])
		buildNamePool()
		newGameRound()
	}

	useEffect(() => {
		if (shipName) {
			loadImage(`https://raw.githubusercontent.com/risbi0/al-guess-game-images/main/img/hidden/${btoa(caesarCipher(shipName))}.png`)
			.then((image) => {
				if (img.current) {
					img.current.src = image.src

					const roundDuration = 10000
					const interval = 10
					const totalSteps = roundDuration / interval

					loopProgress.current = setInterval(() => {
						if (progress < 100) {
							setProgress((prevProgress) => prevProgress + (100 / totalSteps))
						}
					}, interval)

					deadline.current = setTimeout(() => {
						// not answered
						displayCorrectAnswer(false)
					}, roundDuration)
				}
			})
		}
	}, [shipName])

	useEffect(() => {
		// log answer details
		if (isCorrectAnswer !== null) {
			setAnswerLog(() => {
				answerLog.push({
					'isCorrect': isCorrectAnswer,
					'name': shipName,
					'answer': input.current.value,
					'speed': Math.round(progress * 10) / 100
				})
				return answerLog
			})
		}
	}, [isCorrectAnswer])

	useEffect(() => {
		if ((normalMode && rounds > 10) || (endlessMode && strikes === 5)) setEndRound(true)
	}, [rounds, strikes])

	useEffect(() => {
		if (endRound) {
			clearInterval(loopProgress.current)
			clearTimeout(deadline.current)
			setGameRunning(false)
			setGameEnd(true)
			// calculate avg speed
			const getAllSpeed = answerLog.map(obj => obj['speed'])
			const addAllSpeed = getAllSpeed.reduce((total, current) => total + current)
			setAvgSpeed(Math.round(addAllSpeed / (rounds - 1) * 100) / 100)
		}
	}, [endRound])

  return (
    <>
		{
			!gameRunning && !gameEnd &&
			<>
				<div id='answer-display'>Azur Lane Guessing Game</div>
				<div id='container' className='menu-styling'>
					<p>Characters up to <a href="https://azurlane.koumakan.jp/wiki/Effulgence_Before_Eclipse">Effulgence Before Eclipse</a></p>
					<p>Normal Mode - 10 rounds, 10 sec. time limit</p>
					<p>Endless Mode - play until 5 wrong answers/unanswered rounds, 10 sec. time limit</p>
					<p>Select which types of skins to add to default skins</p>
					<div id='switches'>
						<div className='switch-container'>
							<div>Retrofit</div>
							<label className='switch'>
								<input type='checkbox' onChange={toggleRetrofit} checked={includeRetrofit}></input>
								<span className='slider'></span>
							</label>
						</div>
						<div className='switch-container'>
							<div>Skin</div>
							<label className='switch'>
								<input type='checkbox' onChange={toggleSkin} checked={includeSkin}></input>
								<span className='slider'></span>
							</label>
						</div>
					</div>
					<div id='modes'>
						<button onClick={() => startGame(true, false)}>NORMAL MODE</button>
						<button onClick={() => startGame(false, true)}>ENDLESS MODE</button>
					</div>
				</div>
			</>
		}
		{
			gameRunning && !gameEnd &&
			<>
				<div id='progress-bar' style={{width: `${progress}%`}}></div>
				<div
					id='answer-display'
					className={
						isCorrectAnswer !== null && isCorrectAnswer
							? 'correct-ans-glow'
							: isCorrectAnswer !== null && !isCorrectAnswer
								? 'wrong-ans-glow'
								: ''
					}
				>
					{
						isCorrectAnswer === null
							? normalMode
								? `Round ${rounds} of 10`
								: `Round ${rounds} (${strikes} / 5 strikes)`
							: shipName.replace('_Default', '').replace('_', ' ')
					}
				</div>
				<div id='container'>
					<img ref={img} src='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='/>
				</div>
				<div>
					<input
						type='text'
						ref={input}
						onInput={showSuggestions}
						onKeyDown={highlightOptions}
						placeholder='Who?'
						maxLength='30'
						spellCheck='false'
					>
					</input>
					{suggestions.length > 0 && (
						<div id='suggestions' ref={optionsParent}>
						{suggestions.map((suggestion, index) => (
							<div
								key={index}
								className={index === optionIndex ? 'selected' : ''}
								onMouseEnter={setInputText}
								onClick={submitAnswer}
							>
								{suggestion}
							</div>
						))}
					</div>
					)}
				</div>
			</>
		}
		{
			!gameRunning && gameEnd &&
			<>
				<div id='score'>
					{
						endlessMode && pickedIndices.current.length === namePool.current.length
							? <p>No more characters remaining</p>
							: null
					}
					<p>Score: {score} / {normalMode ? '10' : rounds - 1}</p>
					<p>Avg. Answer Speed: {avgSpeed}s</p>
				</div>
				<table>
					<thead>
						<tr>
							<th></th>
							<th>Name</th>
							<th>Answer / Speed</th>
						</tr>
					</thead>
					<tbody>
						{answerLog.map((answer, index) => (
							<tr key={index}>
								<td>{answer.isCorrect ? '✅' : '❌'}</td>
								<td>{answer.name.replace('_Default', '').replace('_', ' ')}</td>
								<td style={answer.isCorrect ? {textAlign: 'center'} : {}}>
									{answer.isCorrect ? `${answer.speed}s` : answer.answer}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<div id='end-game-btns'>
					<button onClick={() => startGame(normalMode, endlessMode)}>PLAY AGAIN</button>
					<button onClick={()=>{setGameRunning(false);setGameEnd(false)}}>HOME</button>
				</div>
			</>
		}
    </>
  )
}

export default App
