import React, { useState } from 'react';
import { Button } from '../ui';
import SimpleCustomFood from './SimpleCustomFood';

const TestCustomFood = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test Custom Food Creation</h2>
      <p className="mb-4">Click the button below to test the custom food creation feature:</p>
      
      <Button 
        onClick={() => setShowModal(true)}
        variant="primary"
        className="mb-4"
      >
        Open Custom Food Form
      </Button>

      <SimpleCustomFood
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onFoodCreated={(food) => {
          console.log('Custom food created:', food);
          alert('Custom food created: ' + food.name);
          setShowModal(false);
        }}
        searchQuery="test food"
      />
    </div>
  );
};

export default TestCustomFood;
