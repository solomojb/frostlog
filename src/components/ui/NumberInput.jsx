function NumberInput({ value, onChange, min = 0, max, placeholder, style, ...rest }) {
    return (
        <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            min={min}
            max={max}
            placeholder={placeholder}
            className="input-frost text-center"
            style={style}
            onInput={e => { if (e.target.value.length > 3) e.target.value = e.target.value.slice(0, 3); }}
            {...rest}
        />
    );
}

export default NumberInput;
