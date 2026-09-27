import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type EligibilityCredential = { ageOver18: boolean;
                                      qualifyingPathway: boolean
                                    };

export type HolderSecret = Uint8Array;

export type AdminKey = Uint8Array;

export type Schnorr_SchnorrSignature = { announcement: __compactRuntime.JubjubPoint;
                                         response: bigint
                                       };

export type Witnesses<PS> = {
  getSchnorrReduction(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      challengeHash_0: bigint): [PS, [bigint, bigint]];
  getHolderSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, HolderSecret];
  getEligibilityCredential(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, [EligibilityCredential,
                                                                                        Schnorr_SchnorrSignature,
                                                                                        bigint]];
}

export type ImpureCircuits<PS> = {
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: bigint,
                 issuerPublicKey_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  removeIssuer(context: __compactRuntime.CircuitContext<PS>, issuerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setPolicy(context: __compactRuntime.CircuitContext<PS>,
            nextPolicyHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: bigint,
                 issuerPublicKey_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  removeIssuer(context: __compactRuntime.CircuitContext<PS>, issuerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setPolicy(context: __compactRuntime.CircuitContext<PS>,
            nextPolicyHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
  deriveAdminKey(secret_0: HolderSecret): AdminKey;
}

export type Circuits<PS> = {
  deriveAdminKey(context: __compactRuntime.CircuitContext<PS>,
                 secret_0: HolderSecret): __compactRuntime.CircuitResults<PS, AdminKey>;
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: bigint,
                 issuerPublicKey_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  removeIssuer(context: __compactRuntime.CircuitContext<PS>, issuerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setPolicy(context: __compactRuntime.CircuitContext<PS>,
            nextPolicyHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  readonly policyHash: Uint8Array;
  readonly adminKey: AdminKey;
  readonly finalizedProofs: bigint;
  usedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  trustedIssuers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): __compactRuntime.JubjubPoint;
    [Symbol.iterator](): Iterator<[bigint, __compactRuntime.JubjubPoint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               initialPolicyHash_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
