export declare type Randomizer = (data: Uint8Array) => Uint8Array

/** Four UUID-v4 ASCII identifiers hashed with SHA-512; owned bytes are cleared. */
export declare function passKey(randomizer?: Randomizer): Promise<string>
