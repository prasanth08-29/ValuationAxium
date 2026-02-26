import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Car, UserCircle, Briefcase } from 'lucide-react';

const ENTITIES = [
    {
        id: 'bank',
        title: 'Bank Valuations',
        description: 'Templates for residential, commercial and land valuations required by banking institutions.',
        icon: Building2,
        color: 'blue'
    },
    {
        id: 'vehicle',
        title: 'Vehicle Valuations',
        description: 'Standardized forms for assessing the value of cars, trucks, and heavy machinery.',
        icon: Car,
        color: 'amber'
    },
    {
        id: 'individual',
        title: 'Individual Properties',
        description: 'Custom property and asset valuations requested by private individuals.',
        icon: UserCircle,
        color: 'emerald'
    },
    {
        id: 'company',
        title: 'Company Assets',
        description: 'Corporate valuations for auditing, acquisitions and financial reporting.',
        icon: Briefcase,
        color: 'purple'
    }
];

export default function Entities() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Valuation Entities</h1>
                <p className="text-gray-600 mt-1">Select an entity category to browse or create specific valuation templates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ENTITIES.map((entity) => {
                    const Icon = entity.icon;

                    const colorClasses = {
                        blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400',
                        amber: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400',
                        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400',
                        purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400'
                    };

                    const iconBgClasses = {
                        blue: 'bg-blue-100',
                        amber: 'bg-amber-100',
                        emerald: 'bg-emerald-100',
                        purple: 'bg-purple-100'
                    };

                    return (
                        <Link
                            key={entity.id}
                            to={`/entities/${entity.id}`}
                            className={`flex flex-col p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg bg-white
                                ${colorClasses[entity.color].split(' hover:')[1] ? `hover:${colorClasses[entity.color].split(' hover:')[1]}` : ''}
                            `}
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${iconBgClasses[entity.color]} text-${entity.color}-600`}>
                                <Icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{entity.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
                                {entity.description}
                            </p>
                            <div className="mt-6 flex items-center text-sm font-semibold text-primary-600">
                                View Templates
                                <span className="ml-2">→</span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
